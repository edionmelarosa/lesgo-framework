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
import { Pool as PgPool } from 'pg';
class PgPoolAdapter {
  constructor(pool) {
    this.pool = pool;
  }
  query(sql, values) {
    return __awaiter(this, void 0, void 0, function* () {
      const result =
        typeof sql === 'object'
          ? yield this.pool.query(sql)
          : yield this.pool.query(sql, values);
      return [result.rows, result.fields];
    });
  }
  ping() {
    return __awaiter(this, void 0, void 0, function* () {
      const client = yield this.pool.connect();
      try {
        yield client.query('SELECT 1');
      } finally {
        client.release();
      }
    });
  }
  end() {
    return __awaiter(this, void 0, void 0, function* () {
      yield this.pool.end();
    });
  }
}
const pgDriver = {
  createPool(connOpts) {
    var _a;
    const pool = new PgPool(
      Object.assign(
        {
          host: connOpts.host,
          port: (_a = connOpts.port) !== null && _a !== void 0 ? _a : 5432,
          database: connOpts.database,
          user: connOpts.user,
          password: connOpts.password,
          max: connOpts.connectionLimit,
        },
        connOpts
      )
    );
    return new PgPoolAdapter(pool);
  },
};
export default pgDriver;
