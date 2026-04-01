const fs = require('fs');
const { parse } = require('csv-parse');
const { Pool } = require('pg');

const DB_URL = 'postgres://postgres:aQsyGZ%25kX2%401cNkI@100.113.34.5:5432/apps';
const CSV_FILE = './results/App_eng_Results_200.csv';

const pool = new Pool({ connectionString: DB_URL });

async function main() {
  const client = await pool.connect();
  try {
    const records = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(CSV_FILE)
        .pipe(parse({ columns: true, relax_quotes: true, skip_empty_lines: true, bom: true }))
        .on('data', r => records.push(r))
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`Parsed ${records.length} rows. Updating titles...`);

    let updated = 0;
    for (const r of records) {
      const result = await client.query(
        'UPDATE app_results SET title = $1 WHERE "appId" = $2',
        [r.title || null, r.appId]
      );
      updated += result.rowCount;
    }

    console.log(`Done. Updated ${updated} rows.`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
