import { RDSAuroraMySQLProxyClientOptions } from '../../../../types/aws';
declare const getClient: (connOptions?: Record<string, any>, clientOpts?: RDSAuroraMySQLProxyClientOptions) => Promise<import("../../../../types/db").PoolAdapter>;
export default getClient;
