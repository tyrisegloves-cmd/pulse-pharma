import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// All DB initialisation is deferred inside getDb() so that importing this
// module at build time (Next.js page-data collection) never touches
// process.env.DATABASE_URL.  The env-var is only required at request time.

type DrizzleDb = ReturnType<typeof drizzle>;

const globalForDb = globalThis as typeof globalThis & {
  __pool?: Pool;
  __db?: DrizzleDb;
};

export function getDb(): DrizzleDb {
  if (globalForDb.__db) return globalForDb.__db;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");

  if (!globalForDb.__pool) {
    globalForDb.__pool = new Pool({ connectionString: url });
  }

  globalForDb.__db = drizzle(globalForDb.__pool);
  return globalForDb.__db;
}

