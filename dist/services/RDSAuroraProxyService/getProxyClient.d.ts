import { RDSAuroraProxyClientOptions } from '../../types/aws';
import { PoolAdapter, PoolConnOptions } from '../../types/db';
export interface Singleton {
    [key: string]: PoolAdapter;
}
export declare const singleton: Singleton;
declare const getClient: (connOptions?: PoolConnOptions, clientOpts?: RDSAuroraProxyClientOptions) => Promise<PoolAdapter>;
export default getClient;
