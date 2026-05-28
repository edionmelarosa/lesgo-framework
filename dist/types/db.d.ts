export interface QueryConfig {
    text: string;
    values?: any[];
    rowMode?: string;
    [key: string]: any;
}
export interface PoolAdapter {
    query<T = unknown>(sql: string | QueryConfig, values?: any[]): Promise<T>;
    ping(): Promise<void>;
    end(): Promise<void>;
}
export interface DriverAdapter {
    createPool(connOpts: PoolConnOptions): PoolAdapter;
}
export interface PoolConnOptions {
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
    connectionLimit?: number;
    waitForConnections?: boolean;
    queueLimit?: number;
    [key: string]: any;
}
export type SupportedDriver = 'mysql2' | 'pg';
