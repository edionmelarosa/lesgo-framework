import { RDSAuroraProxyClientOptions } from '../../../../types/aws';
import { PoolConnOptions } from '../../../../types/db';
declare const getClient: (connOptions?: PoolConnOptions, clientOpts?: RDSAuroraProxyClientOptions) => Promise<import("../../../../types/db").PoolAdapter>;
export default getClient;
