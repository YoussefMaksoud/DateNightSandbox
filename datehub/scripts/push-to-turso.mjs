import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error("❌ TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set");
  process.exit(1);
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Read the migration SQL
const sql = readFileSync(join(__dirname, "migration.sql"), "utf-8");

// Remove comment lines, then split on semicolons
const cleaned = sql.replace(/^--.*$/gm, "");
const statements = cleaned
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

console.log(`📦 Pushing ${statements.length} statements to Turso...`);

let success = 0;
let skipped = 0;

for (const stmt of statements) {
  try {
    await client.execute(stmt + ";");
    success++;
    // Extract table/index name for progress
    const match = stmt.match(/(?:CREATE TABLE|CREATE UNIQUE INDEX|CREATE INDEX)\s+"?(\w+)"?/i);
    if (match) console.log(`  ✅ ${match[1]}`);
  } catch (err) {
    // Table/index already exists — skip
    if (err.message?.includes("already exists")) {
      skipped++;
      const match = stmt.match(/(?:CREATE TABLE|CREATE UNIQUE INDEX|CREATE INDEX)\s+"?(\w+)"?/i);
      if (match) console.log(`  ⏭️  ${match[1]} (already exists)`);
    } else {
      console.error(`  ❌ Error: ${err.message}`);
      console.error(`     Statement: ${stmt.slice(0, 80)}...`);
    }
  }
}

console.log(`\n✅ Done: ${success} created, ${skipped} already existed`);
client.close();
