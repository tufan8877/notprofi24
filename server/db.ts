import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  // On Render this MUST be set in Environment variables
  console.error("DATABASE_URL is missing");
}

const isLocal =
  (process.env.DATABASE_URL || "").includes("localhost") ||
  (process.env.DATABASE_URL || "").includes("127.0.0.1");

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? undefined : { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });
