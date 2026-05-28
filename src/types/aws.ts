import { SupportedDriver } from './db';

export interface ClientOptions {
  region?: string;
  singletonConn?: string;
}

export interface RDSAuroraMySQLProxyClientOptions {
  singletonConn?: string;
  databaseName?: string;
  driver?: SupportedDriver;
}
