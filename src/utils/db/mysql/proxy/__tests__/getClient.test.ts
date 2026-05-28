import { getClient } from '../../proxy';
import getProxyClient from '../../../../../services/RDSAuroraProxyService/getProxyClient';

jest.mock(
  '../../../../../services/RDSAuroraProxyService/getProxyClient'
);

describe('getClient', () => {
  const connOptions = {
    host: '127.0.0.1',
    user: 'test_username',
    password: 'test_password',
    database: 'test_database',
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call getProxyClient with the correct parameters', () => {
    const singletonConn = 'default';

    getClient(connOptions, { singletonConn });

    expect(getProxyClient).toHaveBeenCalledTimes(1);
    expect(getProxyClient).toHaveBeenCalledWith(connOptions, {
      singletonConn,
    });
  });

  it('should call getProxyClient with default connOptions, singletonConn if not provided', () => {
    getClient(connOptions, {});

    expect(getProxyClient).toHaveBeenCalledTimes(1);
    expect(getProxyClient).toHaveBeenCalledWith(connOptions, {});
  });

  it('should call getProxyClient with default connOptions, driver if provided', () => {
    const singletonConn = 'default';

    getClient(connOptions, { singletonConn });

    expect(getProxyClient).toHaveBeenCalledTimes(1);
    expect(getProxyClient).toHaveBeenCalledWith(connOptions, {
      singletonConn,
    });
  });

  it('should call getProxyClient with default connOptions, singletonConn and region if not provided', () => {
    getClient();

    expect(getProxyClient).toHaveBeenCalledTimes(1);
    expect(getProxyClient).toHaveBeenCalledWith(undefined, undefined);
  });

  it('should call getProxyClient with default connOptions, singletonConn and region if empty object provided', () => {
    getClient({});

    expect(getProxyClient).toHaveBeenCalledTimes(1);
    expect(getProxyClient).toHaveBeenCalledWith({}, undefined);
  });
});
