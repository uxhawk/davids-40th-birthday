import { sql } from "drizzle-orm";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import * as schema from "./schema";

// Both drivers expose the same query API; we type against one of them.
type DB = PgliteDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __db?: Promise<DB> };

async function connect(): Promise<DB> {
  let db: DB;
  const url = process.env.DATABASE_URL;
  if (url) {
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    db = drizzle(neon(url), { schema }) as unknown as DB;
  } else {
    if (process.env.VERCEL) {
      throw new Error("DATABASE_URL is not set. Add a Neon Postgres database to this project.");
    }
    // Local development: Postgres-in-a-file, no account needed.
    const { mkdirSync } = await import("node:fs");
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    mkdirSync(".data", { recursive: true });
    db = drizzle(new PGlite(".data/pglite"), { schema });
  }
  await db.execute(sql.raw(schema.CREATE_SQL));
  return db;
}

export function getDb(): Promise<DB> {
  if (!globalForDb.__db) {
    globalForDb.__db = connect().catch((err) => {
      globalForDb.__db = undefined;
      throw err;
    });
  }
  return globalForDb.__db;
}
