require('dotenv').config();
const { Pool } = require('pg');

async function dropPhotos() {
  const pool = new Pool({ connectionString: process.env.PG_CONNECTION_STRING });
  try {
    await pool.query('DROP TABLE IF EXISTS photos');
    console.log("photos table dropped successfully!");
  } catch (e) {
    console.error("Error dropping photos table:", e);
  } finally {
    await pool.end();
  }
}

dropPhotos();
