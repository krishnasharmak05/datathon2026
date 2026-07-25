import * as fs from 'fs';
import * as path from 'path';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { performance } from 'perf_hooks';
import { DeterministicParser } from '../functions/crime_intel_api/src/parser/parser';
import { ExecutionPlanner } from '../functions/crime_intel_api/src/parser/planner';
import { DeterministicSQLGenerator } from '../functions/crime_intel_api/src/parser/sql_generator';

const parser = new DeterministicParser();
const planner = new ExecutionPlanner();
const generator = new DeterministicSQLGenerator();

interface TestCase {
  id: number;
  name: string;
  query: string;
  expected: {
    intent: string;
    entities: any;
    planner: any[];
    sql: string;
    parameters: any[];
    join_graph: string[];
  };
}

interface TestLogEntry {
  timestamp: string;
  test_name: string;
  query: string;
  expected_intent: string;
  actual_intent: string;
  expected_entities: any;
  actual_entities: any;
  expected_sql: string;
  actual_sql: string;
  expected_parameters: any[];
  actual_parameters: any[];
  planner: any[];
  passed: boolean;
  errors: string[];
  execution_time_ms: number;
}

// SQL Normalizer for robust comparisons
function normalizeSQL(sql: string): string {
  return sql
    .toLowerCase()
    .replace(/\s+/g, ' ') // Collapse multiple whitespaces and newlines
    .replace(/\s*([,=\(\)<>!])\s*/g, '$1') // Remove spaces around delimiters/operators
    .replace(/\bas\b/g, '') // Remove optional AS keyword
    .replace(/["'`]+/g, '') // Remove quotes to normalize identifiers
    .trim();
}

// SQL Safety Validation Check
function checkSQLSafety(sql: string): { safe: boolean; reason?: string } {
  const upper = sql.toUpperCase();
  const dangerousKeywords = ['UPDATE', 'DELETE', 'INSERT', 'DROP', 'ALTER', 'PRAGMA', 'ATTACH'];
  for (const kw of dangerousKeywords) {
    // Match word boundaries
    const regex = new RegExp(`\\b${kw}\\b`);
    if (regex.test(upper)) {
      return { safe: false, reason: `Contains forbidden keyword: ${kw}` };
    }
  }
  return { safe: true };
}

async function runRegressionSuite() {
  console.log('=== Karnataka Police Crime Intelligence Platform - Regression Suite ===\n');

  // 1. Setup Database Connection
  const dbPath = path.resolve(__dirname, '../database/police_fir.db');
  let db: Database;
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    console.log(`Connected to database at ${dbPath}`);
  } catch (err: any) {
    console.error('Failed to connect to SQLite database:', err.message);
    process.exit(1);
  }

  // 2. Load Regression Cases
  const datasetPath = path.resolve(__dirname, 'datasets/regression.json');
  if (!fs.existsSync(datasetPath)) {
    console.error(`Dataset not found at ${datasetPath}. Please run dataset generator first.`);
    process.exit(1);
  }

  const testCases: TestCase[] = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
  console.log(`Loaded ${testCases.length} regression test cases.`);

  const logEntries: TestLogEntry[] = [];
  let passedCount = 0;
  let failedCount = 0;
  let totalTimeMs = 0;
  const executionTimes: { name: string; time: number }[] = [];

  // Failure categories counters
  let intentErrors = 0;
  let entityErrors = 0;
  let plannerErrors = 0;
  let sqlErrors = 0;
  let parameterErrors = 0;
  let safetyErrors = 0;
  let joinErrors = 0;
  let dbExecutionErrors = 0;

  // 3. Run Test cases loop
  for (const tc of testCases) {
    const startTime = performance.now();
    const errors: string[] = [];

    // Stage 1: Deterministic Parser
    const parsed = parser.parse(tc.query);
    if (!parsed) {
      errors.push('Parser returned null (failed to match any intent)');
      intentErrors++;
    }

    const actualIntent = parsed ? parsed.intent : 'UNKNOWN';
    const actualEntities = parsed ? parsed.entities : {};

    // Validate Intent
    if (actualIntent !== tc.expected.intent) {
      errors.push(`Intent mismatch: Expected "${tc.expected.intent}", got "${actualIntent}"`);
      intentErrors++;
    }

    // Validate Entities
    for (const key of Object.keys(tc.expected.entities)) {
      if (actualEntities[key] === undefined) {
        errors.push(`Entity key missing: Expected "${key}" to be "${tc.expected.entities[key]}", but it was undefined`);
        entityErrors++;
      } else if (String(actualEntities[key]) !== String(tc.expected.entities[key])) {
        errors.push(`Entity value mismatch for "${key}": Expected "${tc.expected.entities[key]}", got "${actualEntities[key]}"`);
        entityErrors++;
      }
    }

    // Stage 2: Execution Planner
    let actualSteps: any[] = [];
    if (parsed) {
      try {
        const plan = planner.plan(parsed);
        actualSteps = plan.steps;
      } catch (err: any) {
        errors.push(`Planner crashed: ${err.message}`);
        plannerErrors++;
      }
    }

    // Validate Planner Steps
    if (actualSteps.length !== tc.expected.planner.length) {
      errors.push(`Planner steps length mismatch: Expected ${tc.expected.planner.length}, got ${actualSteps.length}`);
      plannerErrors++;
    } else {
      for (let i = 0; i < actualSteps.length; i++) {
        if (actualSteps[i].action !== tc.expected.planner[i].action) {
          errors.push(`Planner step ${i} action mismatch: Expected "${tc.expected.planner[i].action}", got "${actualSteps[i].action}"`);
          plannerErrors++;
        }
      }
    }

    // Stage 3: SQL Generator
    let actualSql = '';
    let actualParams: any[] = [];
    let actualJoinGraph: string[] = [];

    if (parsed && actualIntent !== 'INVALID') {
      try {
        const generated = generator.generate(parsed);
        actualSql = generated.sql;
        actualParams = generated.params;
        actualJoinGraph = generated.joinGraph;

        // Normalize and compare SQL templates
        const normExpected = normalizeSQL(tc.expected.sql);
        const normActual = normalizeSQL(actualSql);
        if (normExpected !== normActual) {
          errors.push(`SQL Template mismatch.\nExpected: "${tc.expected.sql}"\nActual:   "${actualSql}"`);
          sqlErrors++;
        }

        // Compare parameters
        if (actualParams.length !== tc.expected.parameters.length) {
          errors.push(`Parameter count mismatch: Expected ${tc.expected.parameters.length}, got ${actualParams.length}`);
          parameterErrors++;
        } else {
          for (let i = 0; i < actualParams.length; i++) {
            if (String(actualParams[i]) !== String(tc.expected.parameters[i])) {
              errors.push(`Parameter value mismatch at index ${i}: Expected "${tc.expected.parameters[i]}", got "${actualParams[i]}"`);
              parameterErrors++;
            }
          }
        }

        // Validate SQL Safety
        const safety = checkSQLSafety(actualSql);
        if (!safety.safe) {
          errors.push(`SQL Safety Violation: ${safety.reason}`);
          safetyErrors++;
        }

        // Validate Join Graph Traversal
        if (JSON.stringify(actualJoinGraph) !== JSON.stringify(tc.expected.join_graph)) {
          errors.push(`Join Graph mismatch.\nExpected: ${JSON.stringify(tc.expected.join_graph)}\nActual:   ${JSON.stringify(actualJoinGraph)}`);
          joinErrors++;
        }

        // Syntactic/Runtime DB Verification
        try {
          // Execute the generated dynamic query to verify schema conformance
          if (actualIntent === 'COUNT') {
            await db.get(actualSql, actualParams);
          } else {
            await db.all(actualSql, actualParams);
          }
        } catch (dbErr: any) {
          errors.push(`Database execution failed: ${dbErr.message}\nSQL: ${actualSql}\nParams: ${JSON.stringify(actualParams)}`);
          dbExecutionErrors++;
        }

      } catch (genErr: any) {
        errors.push(`SQL Generator crashed: ${genErr.message}`);
        sqlErrors++;
      }
    } else if (actualIntent === 'INVALID') {
      // For invalid/contradictory queries, sql should not be generated or empty, or handled gracefully
      actualSql = '';
      actualParams = [];
      actualJoinGraph = [];
    }

    const endTime = performance.now();
    const elapsed = endTime - startTime;
    totalTimeMs += elapsed;
    executionTimes.push({ name: tc.name, time: elapsed });

    const passed = errors.length === 0;
    if (passed) {
      passedCount++;
    } else {
      failedCount++;
    }

    logEntries.push({
      timestamp: new Date().toISOString(),
      test_name: tc.name,
      query: tc.query,
      expected_intent: tc.expected.intent,
      actual_intent: actualIntent,
      expected_entities: tc.expected.entities,
      actual_entities: actualEntities,
      expected_sql: tc.expected.sql,
      actual_sql: actualSql,
      expected_parameters: tc.expected.parameters,
      actual_parameters: actualParams,
      planner: actualSteps,
      passed,
      errors,
      execution_time_ms: elapsed
    });
  }

  // 4. Save Execution Logs
  const logDir = path.resolve(__dirname, 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logFile = path.join(logDir, `regression_${timestamp}.jsonl`);
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });
  for (const entry of logEntries) {
    logStream.write(JSON.stringify(entry) + '\n');
  }
  logStream.end();
  await new Promise(resolve => logStream.on('finish', resolve));

  // Close database connection
  await db.close();

  // 5. Print Summary Report
  console.log('\n==================================================');
  console.log('                REGRESSION REPORT                 ');
  console.log('==================================================');
  console.log(`Total Tests Executed : ${testCases.length}`);
  console.log(`Passed               : ${passedCount}`);
  console.log(`Failed               : ${failedCount}`);
  const successRate = ((passedCount / testCases.length) * 100).toFixed(2);
  console.log(`Success Rate         : ${successRate}%`);
  const avgTime = (totalTimeMs / testCases.length).toFixed(2);
  console.log(`Average Query Time   : ${avgTime} ms`);

  // Slowest tests list
  const sortedTimes = [...executionTimes].sort((a, b) => b.time - a.time);
  console.log('\nTop 5 Slowest Tests:');
  sortedTimes.slice(0, 5).forEach((t, i) => {
    console.log(`  ${i + 1}. ${t.name} (${t.time.toFixed(1)} ms)`);
  });

  // Failure categories breakdown
  console.log('\nFailure Categories Breakdown:');
  console.log(`  Intent Errors              : ${intentErrors}`);
  console.log(`  Entity Extraction Errors   : ${entityErrors}`);
  console.log(`  Planner Errors             : ${plannerErrors}`);
  console.log(`  SQL Generation Errors      : ${sqlErrors}`);
  console.log(`  Parameter Resolution Errors: ${parameterErrors}`);
  console.log(`  SQL Safety Errors          : ${safetyErrors}`);
  console.log(`  JOIN Traversal Errors      : ${joinErrors}`);
  console.log(`  Database Execution Errors  : ${dbExecutionErrors}`);
  console.log('==================================================\n');

  console.log(`Detailed execution log written to:\n${logFile}\n`);

  if (failedCount > 0) {
    // Print details of first 3 failures
    console.log('Sample Failures (First 3):');
    let printed = 0;
    for (const log of logEntries) {
      if (!log.passed) {
        console.log(`\n[FAILED] Test: "${log.test_name}"`);
        console.log(`  Query: "${log.query}"`);
        log.errors.forEach(err => console.log(`  - ${err}`));
        printed++;
        if (printed >= 3) break;
      }
    }
    process.exit(1);
  } else {
    console.log('All regression tests passed successfully!');
    process.exit(0);
  }
}

runRegressionSuite().catch(err => {
  console.error('Fatal crash in regression suite runner:', err);
  process.exit(1);
});
