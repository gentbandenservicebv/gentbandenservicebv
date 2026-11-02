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
  // Create ReturnStatus enum if not exists
  await sql`
    DO $$ BEGIN
      CREATE TYPE "ReturnStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REFUNDED');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `;

  // Create return_request table
  await sql`
    CREATE TABLE IF NOT EXISTS "return_request" (
      "id"            TEXT        NOT NULL,
      "orderId"       TEXT        NOT NULL,
      "customerName"  TEXT        NOT NULL,
      "customerEmail" TEXT        NOT NULL,
      "customerPhone" TEXT,
      "reason"        TEXT        NOT NULL,
      "reasonDetails" TEXT,
      "itemsInfo"     TEXT,
      "status"        "ReturnStatus" NOT NULL DEFAULT 'PENDING',
      "adminNotes"    TEXT,
      "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT "return_request_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "return_request_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `;
  console.log("✅ Table 'return_request' created successfully.");
} catch (err) {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
}
