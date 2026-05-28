import { RDSAuroraProxyClientOptions } from '../../../../types/aws';
declare const getClient: (connOptions?: Record<string, any>, clientOpts?: RDSAuroraProxyClientOptions) => Promise<import("../../../../types/db").PoolAdapter>;
export default getClient;
