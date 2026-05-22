import { logger, validateFields } from '../../utils';
import { RDSAuroraMySQLProxyClientOptions } from '../../types/aws';
import { LesgoException } from '../../exceptions';
import getClient from './getMySQLProxyClient';

const FILE = 'lesgo.services.RDSAuroraMySQLService.query';

const query = async <T = unknown>(
  sql: string,
  preparedValues?: any[],
  connOptions?: Record<string, any>,
  clientOpts?: RDSAuroraMySQLProxyClientOptions
): Promise<T> => {
  const input = validateFields({ sql, preparedValues }, [
    { key: 'sql', type: 'string', required: true },
    { key: 'preparedValues', type: 'array', required: false },
  ]);

  const pool = await getClient(connOptions, clientOpts);

  try {
    const rows = await pool.query<T>(input.sql, input.preparedValues);
    logger.debug(`${FILE}::RECEIVED_RESPONSE`, {
      result: rows,
      sql,
      preparedValues,
    });

    return rows;
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
