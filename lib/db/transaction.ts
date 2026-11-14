import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

import ws from "ws";

// Required for Node.js environments without a global WebSocket.
neonConfig.webSocketConstructor = ws;

const databaseUrl = process.env.NEON_DB_URL;

if (!databaseUrl) {
  throw new Error("NEON_DB_URL is not configured");
}

const globalForDb = globalThis as unknown as {
  neonPool?: Pool;
};

const pool =
  globalForDb.neonPool ??
  new Pool({
    connectionString: databaseUrl,
    max: 5,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.neonPool = pool;
}

export const transactionDb = drizzle({
  client: pool,
  schema,
});