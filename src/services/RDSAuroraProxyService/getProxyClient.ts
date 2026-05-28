import { logger, isEmpty, validateFields } from '../../utils';
import { RDSAuroraProxyClientOptions } from '../../types/aws';
import {
  PoolAdapter,
  DriverAdapter,
  SupportedDriver,
  PoolConnOptions,
} from '../../types/db';
import mysql2Driver from './drivers/mysql2';
import pgDriver from './drivers/pg';

const FILE = 'lesgo.services.RDSAuroraProxyService.getProxyClient';

export interface Singleton {
  [key: string]: PoolAdapter;
}

export const singleton: Singleton = {};

const poolHealthCheckLocks: Record<string, Promise<PoolAdapter> | null> = {};

const poolRecreationCounts: Record<string, number> = {};

const DEFAULT_maxRetries = 3;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const sanitizeForLogging = <T extends Record<string, any>>(
  obj: T
): Partial<T> => {
  if (!obj) return obj;
  const sanitized = { ...obj };
  delete sanitized.password;
  delete sanitized.user;
  return sanitized as Partial<T>;
};

const drivers: Record<SupportedDriver, DriverAdapter> = {
  mysql2: mysql2Driver,
  pg: pgDriver,
};

const resolveDriver = (driver: SupportedDriver): DriverAdapter =>
  drivers[driver];

const isPoolHealthy = async (pool: PoolAdapter): Promise<boolean> => {
  try {
    await pool.ping();
    return true;
  } catch (err) {
    logger.warn(`${FILE}::POOL_PING_FAILED`, { error: { trace: err } });
    return false;
  }
};

const createAndStoreNewPool = async (
  singletonConn: string,
  connOptions: PoolConnOptions | undefined,
  databaseName: string | undefined,
  driver: SupportedDriver
): Promise<PoolAdapter> => {
  const driverImpl = resolveDriver(driver);
  const maxRetries =
    Number(connOptions?.maxPoolCreationRetries) || DEFAULT_maxRetries;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const connOpts: PoolConnOptions = {
        ...connOptions,
        database: databaseName || connOptions?.database,
        driver,
      };

      if (!connOpts.host) {
        throw new Error(`${FILE}::HOST_NOT_PROVIDED`);
      }
      if (!connOpts.user) {
        throw new Error(`${FILE}::USER_NOT_PROVIDED`);
      }
      if (!connOpts.password) {
        throw new Error(`${FILE}::PASSWORD_NOT_PROVIDED`);
      }
      if (!connOpts.database) {
        throw new Error(`${FILE}::DATABASE_NOT_PROVIDED`);
      }

      logger.debug(`${FILE}::CONN_OPTS`, {
        connOpts: sanitizeForLogging(connOpts),
        connOptions: sanitizeForLogging(connOptions || {}),
        driver,
      });

      const pool = driverImpl.createPool(connOpts);

      singleton[singletonConn] = pool;
      poolRecreationCounts[singletonConn] =
        (poolRecreationCounts[singletonConn] || 0) + 1;

      logger.debug(`${FILE}::NEW_RDS_CONNECTION`, {
        attempt,
        recreatedCount: poolRecreationCounts[singletonConn],
        driver,
      });

      return pool;
    } catch (err) {
      logger.warn(`${FILE}::POOL_CREATION_RETRY_FAILED`, {
        attempt,
        error: { trace: err },
      });

      if (attempt < maxRetries) {
        const delay = Math.min(1000, 100 * 2 ** (attempt - 1));
        logger.debug(`${FILE}::POOL_CREATION_BACKOFF`, { attempt, delay });
        await sleep(delay);
      } else {
        throw new Error(`Failed to create pool after ${maxRetries} attempts`);
      }
    }
  }

  throw new Error(`${FILE}::UNEXPECTED_POOL_CREATION_FAILURE`);
};

const getClient = async (
  connOptions?: PoolConnOptions,
  clientOpts?: RDSAuroraProxyClientOptions
): Promise<PoolAdapter> => {
  const options = validateFields(clientOpts || {}, [
    { key: 'singletonConn', type: 'string', required: false },
    { key: 'databaseName', type: 'string', required: false },
  ]);

  logger.debug(`${FILE}::GET_CLIENT_OPTIONS`, {
    connOptions: sanitizeForLogging(connOptions || {}),
    clientOpts: sanitizeForLogging(clientOpts || {}),
    options: sanitizeForLogging(options),
  });

  const singletonConn = options.singletonConn || 'default';
  const databaseName = options.databaseName || connOptions?.database;
  const driver: SupportedDriver = connOptions?.driver || 'mysql2';

  if (!isEmpty(singleton[singletonConn])) {
    if (!poolHealthCheckLocks[singletonConn]) {
      poolHealthCheckLocks[singletonConn] = (async () => {
        try {
          const healthy = await isPoolHealthy(singleton[singletonConn]);
          if (healthy) {
            logger.debug(`${FILE}::REUSE_RDS_CONNECTION`);
            return singleton[singletonConn];
          }

          logger.warn(`${FILE}::POOL_UNHEALTHY_RECONNECTING`);
          try {
            await singleton[singletonConn].end();
          } catch (endErr) {
            logger.warn(`${FILE}::POOL_END_FAILED`, {
              error: { trace: endErr },
            });
          }

          delete singleton[singletonConn];
          return await createAndStoreNewPool(
            singletonConn,
            connOptions,
            databaseName,
            driver
          );
        } finally {
          poolHealthCheckLocks[singletonConn] = null;
        }
      })();
    } else {
      logger.debug(`${FILE}::REUSE_RDS_CONNECTION (from lock)`);
    }

    // Capture lockRef before the finally block can clear poolHealthCheckLocks[singletonConn]
    const lockRef = poolHealthCheckLocks[singletonConn];
    if (!lockRef) {
      // Lock completed synchronously before we could capture it; pool is in singleton
      return singleton[singletonConn];
    }
    return await lockRef;
  }

  return await createAndStoreNewPool(
    singletonConn,
    connOptions,
    databaseName,
    driver
  );
};

export default getClient;
