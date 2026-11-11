import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not set in .env.local");
  process.exit(1);
}

const { neon } = await import("@neondatabase/serverless");
const sql = neon(DATABASE_URL);

console.log("🔌 Connected to Neon PostgreSQL...");

try {
  await sql`
    ALTER TABLE "appointment"
    ADD COLUMN IF NOT EXISTS "reminderSentAt" TIMESTAMPTZ;
  `;
  console.log("✅ Column 'reminderSentAt' added to 'appointment' table (or already exists).");
} catch (err) {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
}

