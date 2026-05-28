import { RDSAuroraProxyClientOptions } from '../../types/aws';
import { PoolConnOptions } from '../../types/db';
declare const query: <T = unknown>(sql: string, preparedValues?: any[], connOptions?: PoolConnOptions, clientOpts?: RDSAuroraProxyClientOptions) => Promise<T>;
export default query;
