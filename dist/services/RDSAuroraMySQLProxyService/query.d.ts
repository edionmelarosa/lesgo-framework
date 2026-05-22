import { RDSAuroraMySQLProxyClientOptions } from '../../types/aws';
declare const query: <T = unknown>(sql: string, preparedValues?: any[], connOptions?: Record<string, any>, clientOpts?: RDSAuroraMySQLProxyClientOptions) => Promise<T>;
export default query;
