import { disconnectProxyClient } from '../../../../services/RDSAuroraProxyService';

/**
 * @deprecated Disconnect db is no longer to be used due to the use of ConnectionPool
 */
const disconnectDb = () => {
  return disconnectProxyClient();
};

export default disconnectDb;
