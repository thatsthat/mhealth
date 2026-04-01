const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const { Pool } = require('pg');

const DB_URL = 'postgres://postgres:aQsyGZ%25kX2%401cNkI@100.113.34.5:5432/apps';
const CSV_FILE = path.join(__dirname, 'ieeeeep.csv');

const pool = new Pool({ connectionString: DB_URL });

const CREATE_TABLE = `
CREATE TABLE IF NOT EXISTS gplay_apps (
  id SERIAL PRIMARY KEY,
  title TEXT,
  description TEXT,
  "descriptionHTML" TEXT,
  summary TEXT,
  installs TEXT,
  "minInstalls" BIGINT,
  "maxInstalls" BIGINT,
  score FLOAT,
  "scoreText" TEXT,
  ratings BIGINT,
  reviews BIGINT,
  histogram JSONB,
  price FLOAT,
  free BOOLEAN,
  currency TEXT,
  "priceText" TEXT,
  "offersIAP" BOOLEAN,
  "IAPRange" TEXT,
  size TEXT,
  "androidVersion" TEXT,
  "androidVersionText" TEXT,
  developer TEXT,
  "developerId" TEXT,
  "developerEmail" TEXT,
  "developerWebsite" TEXT,
  "developerAddress" TEXT,
  "privacyPolicy" TEXT,
  "developerInternalID" TEXT,
  genre TEXT,
  "genreId" TEXT,
  "familyGenre" TEXT,
  "familyGenreId" TEXT,
  icon TEXT,
  "headerImage" TEXT,
  screenshots TEXT,
  video TEXT,
  "videoImage" TEXT,
  "contentRating" TEXT,
  "contentRatingDescription" TEXT,
  "adSupported" BOOLEAN,
  released TEXT,
  updated BIGINT,
  version TEXT,
  "recentChanges" TEXT,
  comments TEXT,
  "editorsChoice" BOOLEAN,
  "appId" TEXT UNIQUE,
  url TEXT
)`;

function toBoolean(val) {
  if (val === 'true') return true;
  if (val === 'false') return false;
  return null;
}

function toFloat(val) {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function toBigInt(val) {
  const n = parseInt(val, 10);
  return isNaN(n) ? null : n;
}

function toJsonb(val) {
  if (!val || val.trim() === '') return null;
  try { return JSON.parse(val); } catch { return null; }
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query(CREATE_TABLE);
    console.log('Table ready.');

    const records = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(CSV_FILE)
        .pipe(parse({ columns: true, relax_quotes: true, skip_empty_lines: true, trim: false }))
        .on('data', row => records.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`Parsed ${records.length} rows. Inserting...`);

    let inserted = 0, skipped = 0;
    for (const r of records) {
      try {
        await client.query(`
          INSERT INTO gplay_apps (
            title, description, "descriptionHTML", summary, installs,
            "minInstalls", "maxInstalls", score, "scoreText", ratings, reviews,
            histogram, price, free, currency, "priceText", "offersIAP", "IAPRange",
            size, "androidVersion", "androidVersionText", developer, "developerId",
            "developerEmail", "developerWebsite", "developerAddress", "privacyPolicy",
            "developerInternalID", genre, "genreId", "familyGenre", "familyGenreId",
            icon, "headerImage", screenshots, video, "videoImage", "contentRating",
            "contentRatingDescription", "adSupported", released, updated, version,
            "recentChanges", comments, "editorsChoice", "appId", url
          ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
            $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,
            $39,$40,$41,$42,$43,$44,$45,$46,$47,$48
          ) ON CONFLICT ("appId") DO NOTHING
        `, [
          r.title || null,
          r.description || null,
          r.descriptionHTML || null,
          r.summary || null,
          r.installs || null,
          toBigInt(r.minInstalls),
          toBigInt(r.maxInstalls),
          toFloat(r.score),
          r.scoreText || null,
          toBigInt(r.ratings),
          toBigInt(r.reviews),
          toJsonb(r.histogram),
          toFloat(r.price),
          toBoolean(r.free),
          r.currency || null,
          r.priceText || null,
          toBoolean(r.offersIAP),
          r.IAPRange || null,
          r.size || null,
          r.androidVersion || null,
          r.androidVersionText || null,
          r.developer || null,
          r.developerId || null,
          r.developerEmail || null,
          r.developerWebsite || null,
          r.developerAddress || null,
          r.privacyPolicy || null,
          r.developerInternalID || null,
          r.genre || null,
          r.genreId || null,
          r.familyGenre || null,
          r.familyGenreId || null,
          r.icon || null,
          r.headerImage || null,
          r.screenshots || null,
          r.video || null,
          r.videoImage || null,
          r.contentRating || null,
          r.contentRatingDescription || null,
          toBoolean(r.adSupported),
          r.released || null,
          toBigInt(r.updated),
          r.version || null,
          r.recentChanges || null,
          r.comments || null,
          toBoolean(r.editorsChoice),
          r.appId || null,
          r.url || null,
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
