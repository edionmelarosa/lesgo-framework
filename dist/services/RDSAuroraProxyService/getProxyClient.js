var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
import { logger, isEmpty, validateFields } from '../../utils';
import mysql2Driver from './drivers/mysql2';
import pgDriver from './drivers/pg';
const FILE = 'lesgo.services.RDSAuroraProxyService.getProxyClient';
export const singleton = {};
const poolHealthCheckLocks = {};
const poolRecreationCounts = {};
const DEFAULT_maxRetries = 3;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const sanitizeForLogging = obj => {
  if (!obj) return obj;
  const sanitized = Object.assign({}, obj);
  delete sanitized.password;
  delete sanitized.user;
  return sanitized;
};
const drivers = {
  mysql2: mysql2Driver,
  pg: pgDriver,
};
const resolveDriver = driver => drivers[driver];
const isPoolHealthy = pool =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      yield pool.ping();
      return true;
    } catch (err) {
      logger.warn(`${FILE}::POOL_PING_FAILED`, { error: { trace: err } });
      return false;
    }
  });
const createAndStoreNewPool = (
  singletonConn,
  connOptions,
  databaseName,
  driver
) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const driverImpl = resolveDriver(driver);
    const maxRetries =
      Number(
        connOptions === null || connOptions === void 0
          ? void 0
          : connOptions.maxPoolCreationRetries
      ) || DEFAULT_maxRetries;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const connOpts = Object.assign(Object.assign({}, connOptions), {
          database:
            databaseName ||
            (connOptions === null || connOptions === void 0
              ? void 0
              : connOptions.database),
        });
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
          const delay = Math.min(1000, 100 * Math.pow(2, attempt - 1));
          logger.debug(`${FILE}::POOL_CREATION_BACKOFF`, { attempt, delay });
          yield sleep(delay);
        } else {
          throw new Error(`Failed to create pool after ${maxRetries} attempts`);
        }
      }
    }
    throw new Error(`${FILE}::UNEXPECTED_POOL_CREATION_FAILURE`);
  });
const getClient = (connOptions, clientOpts) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const options = validateFields(clientOpts || {}, [
      { key: 'singletonConn', type: 'string', required: false },
      { key: 'databaseName', type: 'string', required: false },
      { key: 'driver', type: 'string', required: false },
    ]);
    logger.debug(`${FILE}::GET_CLIENT_OPTIONS`, {
      connOptions: sanitizeForLogging(connOptions || {}),
      clientOpts: sanitizeForLogging(clientOpts || {}),
      options: sanitizeForLogging(options),
    });
    const singletonConn = options.singletonConn || 'default';
    const databaseName =
      options.databaseName ||
      (connOptions === null || connOptions === void 0
        ? void 0
        : connOptions.database);
    const driver =
      (clientOpts === null || clientOpts === void 0
        ? void 0
        : clientOpts.driver) || 'mysql2';
    if (!isEmpty(singleton[singletonConn])) {
      if (!poolHealthCheckLocks[singletonConn]) {
        poolHealthCheckLocks[singletonConn] = (() =>
          __awaiter(void 0, void 0, void 0, function* () {
            try {
              const healthy = yield isPoolHealthy(singleton[singletonConn]);
              if (healthy) {
                logger.debug(`${FILE}::REUSE_RDS_CONNECTION`);
                return singleton[singletonConn];
              }
              logger.warn(`${FILE}::POOL_UNHEALTHY_RECONNECTING`);
              try {
                yield singleton[singletonConn].end();
              } catch (endErr) {
                logger.warn(`${FILE}::POOL_END_FAILED`, {
                  error: { trace: endErr },
                });
              }
              delete singleton[singletonConn];
              return yield createAndStoreNewPool(
                singletonConn,
                connOptions,
                databaseName,
                driver
              );
            } finally {
              poolHealthCheckLocks[singletonConn] = null;
            }
          }))();
      } else {
        logger.debug(`${FILE}::REUSE_RDS_CONNECTION (from lock)`);
      }
      const lockRef = poolHealthCheckLocks[singletonConn];
      const result = yield lockRef;
      if (!result) {
        throw new Error(`${FILE}::Pool health check lock failed unexpectedly`);
      }
      return result;
    }
    return yield createAndStoreNewPool(
      singletonConn,
      connOptions,
      databaseName,
      driver
    );
  });
export default getClient;
