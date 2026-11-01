/**
 * migrate-otp.mjs
 * Creates the pending_appointment_otp table using @neondatabase/serverless
 * (the same HTTP-based driver the app uses).
 *
 * Run with: node scripts/migrate-otp.mjs
 */

import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not set in .env.local");
  process.exit(1);
}

// Dynamic import of @neondatabase/serverless
const { neon } = await import("@neondatabase/serverless");

const sql = neon(DATABASE_URL);

console.log("🔌 Connected via Neon serverless HTTP driver");

try {
  await sql`
    CREATE TABLE IF NOT EXISTS "pending_appointment_otp" (
      "id"               TEXT        NOT NULL,
      "email"            TEXT        NOT NULL,
      "otp"              TEXT        NOT NULL,
      "appointmentData"  TEXT        NOT NULL,
      "expiresAt"        TIMESTAMPTZ NOT NULL,
      "attempts"         INTEGER     NOT NULL DEFAULT 0,
      "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT "pending_appointment_otp_pkey" PRIMARY KEY ("id")
    )
  `;
  console.log("✅ Table 'pending_appointment_otp' is ready.");
} catch (err) {
  console.error("❌ Failed:", err.message);
  process.exit(1);
}
