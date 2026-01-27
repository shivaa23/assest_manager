// server/session.ts
import session from "express-session";
import pgSession from "connect-pg-simple";
import { pool } from "./db";

const PgStore = pgSession(session);

export const sessionMiddleware = session({
  store: new PgStore({
    pool,
    tableName: "session", // ✅ Table auto-create if not exists
  }),
  secret: process.env.SESSION_SECRET || "supersecret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  },
});
