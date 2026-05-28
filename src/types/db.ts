export interface QueryConfig {
  text?: string;
  sql?: string;
  values?: any[];
  rowMode?: string;
  [key: string]: any;
}

export interface PoolAdapter {
  query<T = unknown>(
    sql: string | QueryConfig,
    values?: any[]
  ): Promise<[T[], any[]]>;
  ping(): Promise<void>;
  end(): Promise<void>;
}

export interface DriverAdapter {
  createPool(connOpts: PoolConnOptions): PoolAdapter;
}

interface BasePoolConnOptions {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  maxPoolCreationRetries?: number;
  [key: string]: any;
}

export interface Mysql2PoolConnOptions extends BasePoolConnOptions {
  driver: 'mysql2';
  connectionLimit?: number;
  waitForConnections?: boolean;
  queueLimit?: number;
}

export interface PgPoolConnOptions extends BasePoolConnOptions {
  driver: 'pg';
  max?: number;
}

export type PoolConnOptions = Mysql2PoolConnOptions | PgPoolConnOptions;

export type SupportedDriver = 'mysql2' | 'pg';
