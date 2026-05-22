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
import { getSecretValue } from '../../utils/secretsmanager';
import { rds as rdsConfig } from '../../config';
import mysql2Driver from './drivers/mysql2';
import pgDriver from './drivers/pg';
const FILE = 'lesgo.services.RDSAuroraMySQLProxyService.getMySQLProxyClient';
export const singleton = {};
const poolHealthCheckLocks = {};
const poolRecreationCounts = {};
const MAX_POOL_CREATION_RETRIES = rdsConfig.aurora.mysql.maxPoolCreationRetries;
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
  dbCredentialsSecretId,
  region,
  databaseName,
  driver
) =>
  __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const dbCredentials = dbCredentialsSecretId
      ? yield getSecretValue(dbCredentialsSecretId, undefined, {
          region,
          singletonConn,
        })
      : {};
    const driverImpl = resolveDriver(driver);
    for (let attempt = 1; attempt <= MAX_POOL_CREATION_RETRIES; attempt++) {
      try {
        const connOpts = Object.assign(
          {
            host:
              rdsConfig.aurora.mysql.proxy.host ||
              (dbCredentials === null || dbCredentials === void 0
                ? void 0
                : dbCredentials.host),
            database: databaseName,
            port:
              Number(
                rdsConfig.aurora.mysql.proxy.port ||
                  (dbCredentials === null || dbCredentials === void 0
                    ? void 0
                    : dbCredentials.port)
              ) || undefined,
            user:
              (dbCredentials === null || dbCredentials === void 0
                ? void 0
                : dbCredentials.username) || rdsConfig.aurora.mysql.user,
            password:
              (dbCredentials === null || dbCredentials === void 0
                ? void 0
                : dbCredentials.password) || rdsConfig.aurora.mysql.password,
            connectionLimit:
              Number(rdsConfig.aurora.mysql.proxy.connectionLimit) || 10,
            waitForConnections:
              (_a = rdsConfig.aurora.mysql.proxy.waitForConnections) !== null &&
              _a !== void 0
                ? _a
                : true,
            queueLimit: Number(rdsConfig.aurora.mysql.proxy.queueLimit) || 0,
          },
          connOptions
        );
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
        if (attempt < MAX_POOL_CREATION_RETRIES) {
          const delay = Math.min(1000, 100 * Math.pow(2, attempt - 1));
          logger.debug(`${FILE}::POOL_CREATION_BACKOFF`, { attempt, delay });
          yield sleep(delay);
        } else {
          throw new Error(
            `Failed to create pool after ${MAX_POOL_CREATION_RETRIES} attempts`
          );
        }
      }
    }
    throw new Error(`${FILE}::UNEXPECTED_POOL_CREATION_FAILURE`);
  });
const getClient = (connOptions, clientOpts) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const options = validateFields(clientOpts || {}, [
      { key: 'region', type: 'string', required: false },
      { key: 'singletonConn', type: 'string', required: false },
      { key: 'dbCredentialsSecretId', type: 'string', required: false },
      { key: 'databaseName', type: 'string', required: false },
      { key: 'driver', type: 'string', required: false },
    ]);
    logger.debug(`${FILE}::GET_CLIENT_OPTIONS`, {
      connOptions: sanitizeForLogging(connOptions || {}),
      clientOpts: sanitizeForLogging(clientOpts || {}),
      options: sanitizeForLogging(options),
    });
    const region = options.region || rdsConfig.aurora.mysql.region;
    const singletonConn = options.singletonConn || 'default';
    const dbCredentialsSecretId =
      options.dbCredentialsSecretId ||
      rdsConfig.aurora.mysql.proxy.dbCredentialsSecretId;
    const databaseName =
      options.databaseName || rdsConfig.aurora.mysql.databaseName;
    const driver =
      (clientOpts === null || clientOpts === void 0
        ? void 0
        : clientOpts.driver) || 'mysql2';
    if (!databaseName) {
      throw new Error(`${FILE}::DATABASE_NAME_NOT_PROVIDED`);
    }
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
                dbCredentialsSecretId,
                region,
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
      dbCredentialsSecretId,
      region,
      databaseName,
      driver
    );
  });
export default getClient;
