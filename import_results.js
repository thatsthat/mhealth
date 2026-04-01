const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const { Pool } = require('pg');

const DB_URL = 'postgres://postgres:aQsyGZ%25kX2%401cNkI@100.113.34.5:5432/apps';
const CSV_FILE = path.join(__dirname, 'results/App_eng_Results_200.csv');

const pool = new Pool({ connectionString: DB_URL });

const CREATE_TABLE = `
CREATE TABLE IF NOT EXISTS app_results (
  id SERIAL PRIMARY KEY,
  title TEXT,
  "appId" TEXT,
  url TEXT,
  genre TEXT,
  terms TEXT,
  countries TEXT,
  store TEXT,
  description TEXT,
  summary TEXT,
  installs TEXT,
  score_a FLOAT,
  ratings_a BIGINT,
  score_g FLOAT,
  ratings_g BIGINT,
  dev_g TEXT,
  dev_a TEXT,
  updated TEXT
)`;

function toFloat(val) {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function toBigInt(val) {
  const n = parseInt(val, 10);
  return isNaN(n) ? null : n;
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query(CREATE_TABLE);
    console.log('Table ready.');

    const records = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(CSV_FILE)
        .pipe(parse({ columns: true, relax_quotes: true, skip_empty_lines: true }))
        .on('data', row => records.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`Parsed ${records.length} rows. Inserting...`);

    let inserted = 0, skipped = 0;
    for (const r of records) {
      try {
        await client.query(`
          INSERT INTO app_results (
            title, "appId", url, genre, terms, countries, store,
            description, summary, installs, score_a, ratings_a,
            score_g, ratings_g, dev_g, dev_a, updated
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
        `, [
          r.title || null,
          r.appId || null,
          r.url || null,
          r.genre || null,
          r.terms || null,
          r.countries || null,
          r.store || null,
          r.description || null,
          r.summary || null,
          r.installs || null,
          toFloat(r.score_a),
          toBigInt(r.ratings_a),
          toFloat(r.score_g),
          toBigInt(r.ratings_g),
          r.dev_g || null,
          r.dev_a || null,
          r.updated || null,
        ]);
        inserted++;
      } catch (e) {
        console.error(`Skipped row (appId=${r.appId}): ${e.message}`);
        skipped++;
      }
    }

    console.log(`Done. Inserted: ${inserted}, Skipped/errors: ${skipped}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
