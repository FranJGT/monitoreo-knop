import "server-only";
import mysql, { type Pool, type QueryResult } from "mysql2/promise";

/**
 * Pool único de MySQL para la bitácora. En desarrollo Next.js recarga módulos
 * con frecuencia: guardamos el pool en globalThis para no crear uno por carga.
 */
const globalForDb = globalThis as unknown as {
  bitacoraPool?: Pool;
};

function createPool(): Pool {
  const host = process.env.MYSQL_HOST;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;
  if (!host || !user || !password || !database) {
    throw new Error(
      "Faltan variables MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD o MYSQL_DATABASE en .env"
    );
  }
  return mysql.createPool({
    host,
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 5,
    charset: "utf8mb4_unicode_ci",
    timezone: "local",
  });
}

export function getPool(): Pool {
  if (!globalForDb.bitacoraPool) {
    globalForDb.bitacoraPool = createPool();
  }
  return globalForDb.bitacoraPool;
}

/** Ejecuta una consulta parametrizada. El caller castea a RowDataPacket[] o ResultSetHeader. */
export async function query(
  sql: string,
  params: (string | number | null)[] = []
): Promise<QueryResult> {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}
