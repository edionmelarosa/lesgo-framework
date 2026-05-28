import { RDSAuroraProxyClientOptions } from '../../types/aws';
declare const query: <T = unknown>(sql: string, preparedValues?: any[], connOptions?: Record<string, any>, clientOpts?: RDSAuroraProxyClientOptions) => Promise<T>;
export default query;
