import getClientService from '../../../../services/RDSAuroraMySQLProxyService/getMySQLProxyClient';
import { RDSAuroraMySQLProxyClientOptions } from '../../../../types/aws';

const getClient = (
  connOptions?: Record<string, any>,
  clientOpts?: RDSAuroraMySQLProxyClientOptions
) => {
  return getClientService(connOptions, clientOpts);
};

export default getClient;
