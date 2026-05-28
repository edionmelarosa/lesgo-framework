import { logger, validateFields } from '../../utils';
import { RDSAuroraProxyClientOptions } from '../../types/aws';
import { LesgoException } from '../../exceptions';
import { PoolConnOptions } from '../../types/db';
import getClient from './getProxyClient';

const FILE = 'lesgo.services.RDSAuroraProxyService.query';

const query = async <T = unknown>(
  sql: string,
  preparedValues?: any[],
  connOptions?: PoolConnOptions,
  clientOpts?: RDSAuroraProxyClientOptions
): Promise<T> => {
  const input = validateFields({ sql, preparedValues }, [
    { key: 'sql', type: 'string', required: true },
    { key: 'preparedValues', type: 'array', required: false },
  ]);

  const pool = await getClient(connOptions, clientOpts);

  try {
    const result = await pool.query<T>(input.sql, input.preparedValues);
    const rows = Array.isArray(result) ? result[0] : result.rows;
    logger.debug(`${FILE}::RECEIVED_RESPONSE`, {
      rows,
      sql,
      preparedValues,
    });

    return rows as unknown as T;
  } catch (err) {
    throw new LesgoException('Failed to query', `${FILE}::QUERY_ERROR`, 500, {
      err,
      sql,
      preparedValues,
      connOptions,
      clientOpts,
    });
  }
};

export default query;
