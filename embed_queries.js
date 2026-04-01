const fs = require("fs");
const { Pool } = require("pg");
const OpenAI = require("openai");

const DB_URL =
  "postgres://postgres:aQsyGZ%25kX2%401cNkI@100.113.34.5:5432/apps";

const envContent = fs.readFileSync(".env.local", "utf8");
const OPENAI_API_KEY = envContent.match(/OPENAI_API_KEY="(.+?)"/)[1];
const MODEL = "text-embedding-3-large";
const BATCH_SIZE = 20;

const pool = new Pool({ connectionString: DB_URL });
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getEmbeddings(texts) {
  const response = await openai.embeddings.create({
    model: MODEL,
    input: texts,
  });
  return response.data.map((d) => d.embedding);q
}

async function main() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, text FROM queries WHERE text_embedding IS NULL ORDER BY id`,
    );
    console.log(`Rows to embed: ${rows.length}`);

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const texts = batch.map((r) => r.text);

      let embeddings;
      try {
        embeddings = await getEmbeddings(texts);
      } catch (e) {
        console.error(
          `Batch ${i}-${i + batch.length} failed: ${e.message}. Retrying after 5s...`,
        );
        await sleep(5000);
        embeddings = await getEmbeddings(texts);
      }

      for (let j = 0; j < batch.length; j++) {
        const vec = "[" + embeddings[j].join(",") + "]";
        await client.query(
          `UPDATE queries SET text_embedding = $1 WHERE id = $2`,
          [vec, batch[j].id],
        );
      }

      console.log(
        `Embedded ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`,
      );
      if (i + BATCH_SIZE < rows.length) await sleep(200);
    }

    console.log("Done.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
