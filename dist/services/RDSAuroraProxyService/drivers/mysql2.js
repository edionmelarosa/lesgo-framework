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
import { createPool as mysql2CreatePool } from 'mysql2/promise';
class Mysql2PoolAdapter {
  constructor(pool) {
    this.pool = pool;
  }
  query(sql, values) {
    return __awaiter(this, void 0, void 0, function* () {
      var _a, _b;
      const sqlStr =
        typeof sql === 'object'
          ? (_b = (_a = sql.sql) !== null && _a !== void 0 ? _a : sql.text) !==
              null && _b !== void 0
            ? _b
            : ''
          : sql;
      const vals = typeof sql === 'object' ? sql.values : values;
      const [rows, fields] = yield this.pool.query(sqlStr, vals);
      return [rows, fields];
    });
  }
  ping() {
    return __awaiter(this, void 0, void 0, function* () {
      const conn = yield this.pool.getConnection();
      try {
        yield conn.ping();
      } finally {
        conn.release();
      }
    });
  }
  end() {
    return __awaiter(this, void 0, void 0, function* () {
      yield this.pool.end();
    });
  }
}
const mysql2Driver = {
  createPool(connOpts) {
    var _a;
    const pool = mysql2CreatePool(
      Object.assign(
        {
          host: connOpts.host,
          port: (_a = connOpts.port) !== null && _a !== void 0 ? _a : 3306,
          database: connOpts.database,
          user: connOpts.user,
          password: connOpts.password,
          connectionLimit: connOpts.connectionLimit,
          waitForConnections: connOpts.waitForConnections,
          queueLimit: connOpts.queueLimit,
        },
        connOpts
      )
    );
    return new Mysql2PoolAdapter(pool);
  },
};
export default mysql2Driver;
