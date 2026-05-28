import queryService from '../../../../services/RDSAuroraProxyService/query';
import { RDSAuroraProxyClientOptions } from '../../../../types/aws';

const query = async <T>(
  sql: string,
  preparedValues?: any[],
  connOptions?: Record<string, any>,
  clientOpts?: RDSAuroraProxyClientOptions
) => {
  return queryService<T>(sql, preparedValues, connOptions, clientOpts);
};

export default query;
