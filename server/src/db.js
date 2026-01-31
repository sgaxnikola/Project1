import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

const rootDir = process.cwd();
const dataDir = path.join(rootDir, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'app.db');
export const db = new Database(dbPath);

export function initDb() {
  const schemaPath = path.join(rootDir, 'src', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
}
