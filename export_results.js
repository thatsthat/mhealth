const fs = require('fs');
const { Pool } = require('pg');
const { Parser } = require('json2csv');

const DB_URL = 'postgres://postgres:aQsyGZ%25kX2%401cNkI@100.113.34.5:5432/apps';
const pool = new Pool({ connectionString: DB_URL });

async function main() {
  const client = await pool.connect();
  try {
    const colRes = await client.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'app_results' AND column_name != 'description_embedding'
       ORDER BY ordinal_position`
    );
    const cols = colRes.rows.map(r =>
      /^[a-z_][a-z0-9_]*$/.test(r.column_name) ? r.column_name : `"${r.column_name}"`
    ).join(', ');

    const { rows } = await client.query(
      `SELECT ${cols} FROM app_results ORDER BY id`
    );
    console.log(`Exporting ${rows.length} rows...`);
    const parser = new Parser();
    const csv = parser.parse(rows);
    fs.writeFileSync('results/app_results_export.csv', csv, 'utf8');
    console.log('Saved to results/app_results_export.csv');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
