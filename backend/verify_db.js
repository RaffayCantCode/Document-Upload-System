require('dotenv').config();
const { Pool } = require('pg');

async function verify() {
  const pool = new Pool({ connectionString: process.env.PG_CONNECTION_STRING });
  try {
    const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'applicants'
      ORDER BY ordinal_position;
    `);
    console.log("Applicants Columns:", res.rows.map(r => r.column_name).join(", "));
  } catch (e) {
    console.error("Query failed:", e);
  } finally {
    await pool.end();
  }
}

verify();
