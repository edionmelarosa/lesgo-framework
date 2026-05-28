import getClientService from '../../../../services/RDSAuroraProxyService/getProxyClient';
const getClient = (connOptions, clientOpts) => {
  return getClientService(connOptions, clientOpts);
};
export default getClient;
