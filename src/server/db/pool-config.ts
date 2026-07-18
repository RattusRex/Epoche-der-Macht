type DatabasePoolConfig = {
  connectionString: string;
  connectionTimeoutMillis?: number;
  query_timeout?: number;
  statement_timeout?: number;
};

export function createPoolConfig(
  connectionString: string,
  operationTimeoutMs?: number,
): DatabasePoolConfig {
  if (operationTimeoutMs === undefined) {
    return { connectionString };
  }

  return {
    connectionString,
    connectionTimeoutMillis: operationTimeoutMs,
    query_timeout: operationTimeoutMs,
    statement_timeout: operationTimeoutMs,
  };
}
