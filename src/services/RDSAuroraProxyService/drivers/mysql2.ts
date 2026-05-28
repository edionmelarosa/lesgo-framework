import { createPool as mysql2CreatePool } from 'mysql2/promise';
import { DriverAdapter, Mysql2PoolConnOptions, PoolAdapter, QueryConfig } from '../../../types/db';

class Mysql2PoolAdapter implements PoolAdapter {
  private pool: ReturnType<typeof mysql2CreatePool>;

  constructor(pool: ReturnType<typeof mysql2CreatePool>) {
    this.pool = pool;
  }

  async query<T = unknown>(
    sql: string | QueryConfig,
    values?: any[]
  ): Promise<[T[], any[]]> {
    const [rows, fields] =
      typeof sql === 'object'
        ? await this.pool.query(sql as any)
        : await this.pool.query(sql, values);
    return [rows as T[], fields as any[]];
  }

  async ping(): Promise<void> {
    const conn = await this.pool.getConnection();
    try {
      await conn.ping();
    } finally {
      conn.release();
    }
  }

  async end(): Promise<void> {
    await this.pool.end();
  }
}

const mysql2Driver: DriverAdapter = {
  createPool(connOpts: Mysql2PoolConnOptions): PoolAdapter {
    const pool = mysql2CreatePool({
      host: connOpts.host,
      port: connOpts.port ?? 3306,
      database: connOpts.database,
      user: connOpts.user,
      password: connOpts.password,
      connectionLimit: connOpts.connectionLimit,
      waitForConnections: connOpts.waitForConnections,
      queueLimit: connOpts.queueLimit,
      ...connOpts,
    });
    return new Mysql2PoolAdapter(pool);
  },
};

export default mysql2Driver;
