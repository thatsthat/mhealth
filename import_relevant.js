const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const { Pool } = require('pg');

const DB_URL = 'postgres://postgres:aQsyGZ%25kX2%401cNkI@100.113.34.5:5432/apps';
const CSV_FILE = path.join(__dirname, 'results/relevant.csv');

const pool = new Pool({ connectionString: DB_URL });

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`ALTER TABLE app_results ADD COLUMN IF NOT EXISTS relevant BOOLEAN DEFAULT false`);
    await client.query(`UPDATE app_results SET relevant = false`);
    console.log('Column "relevant" ready, all rows set to false.');

    const records = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(CSV_FILE)
        .pipe(parse({ columns: true, relax_quotes: true, skip_empty_lines: true }))
        .on('data', row => records.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    const titles = records.map(r => r.title);
    console.log(`Found ${titles.length} titles in CSV. Updating...`);

    const res = await client.query(
      `UPDATE app_results SET relevant = true WHERE title = ANY($1)`,
      [titles]
    );
    console.log(`Done. Rows set to true: ${res.rowCount}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
