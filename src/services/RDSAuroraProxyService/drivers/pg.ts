import { Pool as PgPool } from 'pg';
import { DriverAdapter, PoolAdapter, PoolConnOptions, QueryConfig } from '../../../types/db';

class PgPoolAdapter implements PoolAdapter {
  private pool: PgPool;

  constructor(pool: PgPool) {
    this.pool = pool;
  }

  async query<T = unknown>(sql: string | QueryConfig, values?: any[]): Promise<T> {
    const result =
      typeof sql === 'object'
        ? await this.pool.query(sql as any)
        : await this.pool.query(sql, values);
    return result.rows as T;
  }

  async ping(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('SELECT 1');
    } finally {
      client.release();
    }
  }

  async end(): Promise<void> {
    await this.pool.end();
  }
}

const pgDriver: DriverAdapter = {
  createPool(connOpts: PoolConnOptions): PoolAdapter {
    const pool = new PgPool({
      host: connOpts.host,
      port: connOpts.port ?? 5432,
      database: connOpts.database,
      user: connOpts.user,
      password: connOpts.password,
      max: connOpts.connectionLimit,
      ...connOpts,
    });
    return new PgPoolAdapter(pool);
  },
};

export default pgDriver;
