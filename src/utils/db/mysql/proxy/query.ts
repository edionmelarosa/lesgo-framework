import queryService from '../../../../services/RDSAuroraProxyService/query';
import { RDSAuroraProxyClientOptions } from '../../../../types/aws';
import { PoolConnOptions } from '../../../../types/db';

const query = async <T>(
  sql: string,
  preparedValues?: any[],
  connOptions?: PoolConnOptions,
  clientOpts?: RDSAuroraProxyClientOptions
) => {
  return queryService<T>(sql, preparedValues, connOptions, clientOpts);
};

export default query;
