import { drizzle } from "drizzle-orm/libsql/web";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof drizzle>;
};

function createDb() {
  return drizzle({
    connection: {
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    },
    schema,
  });
}

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== "production") globalForDb.db = db;
