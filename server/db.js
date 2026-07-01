import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, 'data.sqlite'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    savings_rate_target REAL NOT NULL DEFAULT 20,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL,
    amount REAL NOT NULL CHECK (amount > 0),
    date TEXT NOT NULL,
    recurring INTEGER NOT NULL DEFAULT 0,
    note TEXT
  );

  CREATE TABLE IF NOT EXISTS joint_account (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    balance REAL NOT NULL DEFAULT 0,
    last_updated TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS contributions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount REAL NOT NULL CHECK (amount > 0),
    date TEXT NOT NULL,
    note TEXT
  );

  CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    target_amount REAL NOT NULL,
    target_date TEXT,
    current_amount REAL NOT NULL DEFAULT 0,
    priority INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    name TEXT NOT NULL,
    UNIQUE (type, name)
  );
`);

db.prepare(`INSERT OR IGNORE INTO joint_account (id, balance) VALUES (1, 0)`).run();

const DEFAULT_CATEGORIES = [
  ['expense', 'Rent'],
  ['expense', 'Groceries'],
  ['expense', 'Utilities'],
  ['expense', 'Subscriptions'],
  ['expense', 'Debt payments'],
  ['expense', 'Transportation'],
  ['expense', 'Discretionary'],
  ['expense', 'Other'],
  ['income', 'Salary'],
  ['income', 'Freelance'],
  ['income', 'Gift'],
  ['income', 'Other'],
];

const insertCategory = db.prepare(
  'INSERT OR IGNORE INTO categories (type, name) VALUES (?, ?)'
);
for (const [type, name] of DEFAULT_CATEGORIES) {
  insertCategory.run(type, name);
}

export default db;
