import { LesgoException } from '../../../exceptions';
import getProxyClient from '../getProxyClient';
import { query } from '../../RDSAuroraProxyService';

jest.mock('../getProxyClient');

describe('query', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call getClient with the correct arguments', async () => {
    const sql = 'SELECT * FROM users';
    const preparedValues = [1, 'John'];
    const connOptions = {
      host: 'localhost',
      user: 'root',
      password: 'password',
      database: 'test',
    };
    const clientOpts = {
      singletonConn: 'test-conn',
    };
    const connectionMock = {
      query: jest.fn().mockResolvedValue([{ id: 1, name: 'John' }]),
    };
    (getProxyClient as jest.Mock).mockResolvedValue(connectionMock);

    await query(sql, preparedValues, connOptions, clientOpts);

    expect(getProxyClient).toHaveBeenCalledWith(connOptions, clientOpts);
  });

  it('should execute the query and return the response', async () => {
    const sql = 'SELECT * FROM users';
    const preparedValues = [1, 'John'];
    const rows = [{ id: 1, name: 'John' }];
    const connectionMock = {
      query: jest.fn().mockResolvedValue(rows),
    };
    (getProxyClient as jest.Mock).mockResolvedValue(connectionMock);

    const resp = await query(sql, preparedValues);

    expect(connectionMock.query).toHaveBeenCalledWith(sql, preparedValues);
    expect(resp).toEqual(rows);
  });

  it('should throw a LesgoException if the query fails', async () => {
    const sql = 'SELECT * FROM users';
    const preparedValues = [1, 'John'];
    const connOptions = {
      host: 'localhost',
      user: 'root',
      password: 'password',
      database: 'test',
    };
    const clientOpts = {
      singletonConn: 'test-conn',
    };
    const error = new Error('Query failed');
    const connectionMock = {
      query: jest.fn().mockRejectedValue(error),
    };
    (getProxyClient as jest.Mock).mockResolvedValue(connectionMock);

    await expect(
      query(sql, preparedValues, connOptions, clientOpts)
    ).rejects.toThrow(
      new LesgoException(
        'Failed to query',
        'lesgo.services.RDSAuroraProxyService.query::QUERY_ERROR',
        500,
        {
          err: error,
          sql,
          preparedValues,
          connOptions,
          clientOpts,
        }
      )
    );
  });
});
