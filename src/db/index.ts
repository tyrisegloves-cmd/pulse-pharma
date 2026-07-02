import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Use a lazy getter so DATABASE_URL is only required at runtime (when the DB
// is actually called), not at module-import time during the Next.js build.
// The Vercel build environment does not have DATABASE_URL set, so a top-level
// throw would break `next build` for every route that imports this module.

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }
  return url;
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

function getPool(): Pool {
  if (!globalForDb.__arenaNextJsPostgresqlPool) {
    globalForDb.__arenaNextJsPostgresqlPool = new Pool({
      connectionString: getDatabaseUrl(),
    });
  }
  return globalForDb.__arenaNextJsPostgresqlPool;
}

export const db = drizzle(getPool());
