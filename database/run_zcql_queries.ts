// import * as fs from 'fs';
// import * as path from 'path';
// import catalyst from 'zcatalyst-sdk-node';

// async function runQueries() {
//   const filePath = path.join(__dirname, '..', 'zcql_query');
//   if (!fs.existsSync(filePath)) {
//     console.error(`Error: zcql_query file not found at ${filePath}`);
//     process.exit(1);
//   }

//   console.log('Initializing Zoho Catalyst SDK...');
//   const app = catalyst.initialize();
//   const zcql = app.zcql();

//   const fileContent = fs.readFileSync(filePath, 'utf-8');
//   const lines = fileContent.split(/\r?\n/);
//   const queries: string[] = [];
//   let currentQuery = '';

//   for (const line of lines) {
//     const trimmed = line.trim();
//     if (!trimmed || trimmed.startsWith('--')) {
//       continue;
//     }
    
//     currentQuery += (currentQuery ? ' ' : '') + trimmed;
//     if (trimmed.endsWith(';')) {
//       queries.push(currentQuery);
//       currentQuery = '';
//     }
//   }

//   // Handle any remaining query that didn't end with a semicolon
//   if (currentQuery.trim()) {
//     queries.push(currentQuery.trim());
//   }

//   console.log(`Found ${queries.length} queries to execute.`);

//   let successCount = 0;
//   let errorCount = 0;

//   for (let i = 0; i < queries.length; i++) {
//     const query = queries[i];
//     console.log(`[${i + 1}/${queries.length}] Executing: ${query.substring(0, 80)}${query.length > 80 ? '...' : ''}`);
//     try {
//       await zcql.executeZCQLQuery(query);
//       successCount++;
//     } catch (err: any) {
//       errorCount++;
//       console.error(`Error executing query: ${query}`);
//       console.error(`Reason: ${err.message}`);
//       console.log('Continuing with next query...');
//     }
//   }

//   console.log('\n======================================');
//   console.log('Execution Summary:');
//   console.log(`Total Queries: ${queries.length}`);
//   console.log(`Successful:    ${successCount}`);
//   console.log(`Failed:        ${errorCount}`);
//   console.log('======================================');
// }

// runQueries().catch(console.error);




import fs from "fs";
import path from "path";

const {
  CATALYST_PROJECT_ID = "43341000000013024",
  CATALYST_ACCESS_TOKEN = "1000.11d7be2cb1d55fbe4301b61ee34e1e38.6be07ed30b40fbd31bb61a874874e281",
  CATALYST_DC = "in", // com | in | eu | au | jp | ca
  CATALYST_ENVIRONMENT = "Development",
} = process.env;

if (!CATALYST_PROJECT_ID)
  throw new Error("Missing CATALYST_PROJECT_ID");

if (!CATALYST_ACCESS_TOKEN)
  throw new Error("Missing CATALYST_ACCESS_TOKEN");

const API_BASE = `https://api.catalyst.zoho.${CATALYST_DC}`;

const QUERY_FILE = path.join(__dirname, "..", "zcql_query");

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function executeQuery(query: string, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(
        `${API_BASE}/baas/v1/project/${CATALYST_PROJECT_ID}/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Zoho-oauthtoken ${CATALYST_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
            Environment: CATALYST_ENVIRONMENT,
          },
          body: JSON.stringify({
            query,
          }),
        }
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(
          json?.message ??
            JSON.stringify(json) ??
            `HTTP ${response.status}`
        );
      }

      return json;
    } catch (err) {
      if (attempt === retries) throw err;

      console.log(
        `Retry ${attempt}/${retries - 1}...`
      );

      await sleep(attempt * 1000);
    }
  }
}

async function main() {
  if (!fs.existsSync(QUERY_FILE)) {
    throw new Error(`Cannot find ${QUERY_FILE}`);
  }

  const content = fs.readFileSync(QUERY_FILE, "utf8");

  const queries: string[] = [];

  let current = "";

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("--")) continue;

    current += (current ? " " : "") + trimmed;

    if (trimmed.endsWith(";")) {
      queries.push(current.slice(0, -1));
      current = "";
    }
  }

  if (current.trim()) {
    queries.push(current);
  }

  console.log(`Executing ${queries.length} queries...\n`);

  let ok = 0;
  let failed = 0;

  for (let i = 0; i < queries.length; i++) {
    const q = queries[i];

    process.stdout.write(
      `[${i + 1}/${queries.length}] `
    );

    try {
      await executeQuery(q);

      ok++;

      console.log("OK");
    } catch (e: any) {
      failed++;

      console.log("FAILED");
      console.error(e.message);
      console.error(q);
    }
  }

  console.log("");
  console.log("========== SUMMARY ==========");
  console.log(`Successful : ${ok}`);
  console.log(`Failed     : ${failed}`);
  console.log("=============================");

  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});