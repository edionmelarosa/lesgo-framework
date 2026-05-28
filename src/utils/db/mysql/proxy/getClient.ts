import getClientService from '../../../../services/RDSAuroraProxyService/getProxyClient';
import { RDSAuroraProxyClientOptions } from '../../../../types/aws';

const getClient = (
  connOptions?: Record<string, any>,
  clientOpts?: RDSAuroraProxyClientOptions
) => {
  return getClientService(connOptions, clientOpts);
};

export default getClient;
