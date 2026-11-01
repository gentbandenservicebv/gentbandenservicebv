import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Load .env.local (Next.js default) and fallback to .env
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL || env("DATABASE_URL"),
  },
});
