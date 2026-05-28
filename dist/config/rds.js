export default {
  aurora: {
    mysql: {
      maxPoolCreationRetries:
        Number(
          process.env.LESGO_AWS_RDS_AURORA_MYSQL_DB_MAX_POOL_CREATION_RETRIES
        ) || 3,
      proxy: {
        connectionLimit: Number(
          process.env.LESGO_AWS_RDS_AURORA_MYSQL_PROXY_CONNECTION_LIMIT || 10
        ),
        waitForConnections:
          process.env.LESGO_AWS_RDS_AURORA_MYSQL_PROXY_WAIT_FOR_CONNECTIONS ===
          'true',
        queueLimit: Number(
          process.env.LESGO_AWS_RDS_AURORA_MYSQL_PROXY_QUEUE_LIMIT || 0
        ),
      },
    },
  },
};
