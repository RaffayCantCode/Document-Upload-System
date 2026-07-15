require('dotenv').config();
const { createPostgresRepository } = require('./db/postgresRepository');

async function migrate() {
  console.log("Connecting to Postgres...");
  const repo = createPostgresRepository(process.env.PG_CONNECTION_STRING);
  try {
    console.log("Running ensureTable...");
    await repo.ensureTable();
    console.log("Migration complete! The applicants table should now have photo columns.");
  } catch (e) {
    console.error("Migration failed:", e);
  } finally {
    await repo.close();
  }
}

migrate();
