import { RDSAuroraProxyClientOptions } from '../../types/aws';
import { PoolAdapter } from '../../types/db';
export interface Singleton {
    [key: string]: PoolAdapter;
}
export declare const singleton: Singleton;
declare const getClient: (connOptions?: Record<string, any>, clientOpts?: RDSAuroraProxyClientOptions) => Promise<PoolAdapter>;
export default getClient;
