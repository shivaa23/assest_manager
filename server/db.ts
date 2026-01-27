// server/db.ts
import 'dotenv/config';
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create Postgres pool with SSL for Render
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // 🔹 required for Render PostgreSQL
  },
});

// Create Drizzle ORM instance
export const db = drizzle(pool, { schema });
