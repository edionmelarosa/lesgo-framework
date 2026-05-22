import queryService from '../../../../services/RDSAuroraMySQLProxyService/query';
import { RDSAuroraMySQLProxyClientOptions } from '../../../../types/aws';

const query = async <T>(
  sql: string,
  preparedValues?: any[],
  connOptions?: Record<string, any>,
  clientOpts?: RDSAuroraMySQLProxyClientOptions
) => {
  return queryService<T>(sql, preparedValues, connOptions, clientOpts);
};

export default query;
