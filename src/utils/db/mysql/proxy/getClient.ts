import getClientService from '../../../../services/RDSAuroraProxyService/getProxyClient';
import { RDSAuroraProxyClientOptions } from '../../../../types/aws';
import { PoolConnOptions } from '../../../../types/db';

const getClient = (
  connOptions?: PoolConnOptions,
  clientOpts?: RDSAuroraProxyClientOptions
) => {
  return getClientService(connOptions, clientOpts);
};

export default getClient;
