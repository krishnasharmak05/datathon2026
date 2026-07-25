import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import * as path from 'path';

let dbInstance: Database | null = null;

export async function getDbConnection(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  // Database path relative to this source file, pointing to database/police_fir.db
  const dbPath = path.resolve(__dirname, '../../../../database/police_fir.db');

  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  return dbInstance;
}
