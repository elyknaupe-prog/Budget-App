import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'budget.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    savings_rate_target REAL NOT NULL DEFAULT 20
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'expense' CHECK (type IN ('income', 'expense'))
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    recurring INTEGER NOT NULL DEFAULT 0,
    note TEXT
  );

  CREATE TABLE IF NOT EXISTS joint_account (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    balance REAL NOT NULL DEFAULT 0,
    last_updated TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS contributions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    note TEXT
  );

  CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    target_amount REAL NOT NULL,
    target_date TEXT,
    current_amount REAL NOT NULL DEFAULT 0,
    priority INTEGER NOT NULL DEFAULT 1
  );
`);

const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get();
if (userCount.count === 0) {
  const insertUser = db.prepare('INSERT INTO users (name, email, savings_rate_target) VALUES (?, ?, ?)');
  insertUser.run('Partner One', 'partner-one@example.com', 20);
  insertUser.run('Partner Two', 'partner-two@example.com', 20);
}

const categoryCount = db.prepare('SELECT COUNT(*) AS count FROM categories').get();
if (categoryCount.count === 0) {
  const insertCategory = db.prepare('INSERT INTO categories (name, type) VALUES (?, ?)');
  const defaults = [
    ['Salary', 'income'],
    ['Other Income', 'income'],
    ['Rent/Mortgage', 'expense'],
    ['Groceries', 'expense'],
    ['Utilities', 'expense'],
    ['Subscriptions', 'expense'],
    ['Debt Payments', 'expense'],
    ['Transportation', 'expense'],
    ['Discretionary', 'expense'],
    ['Other', 'expense'],
  ];
  for (const [name, type] of defaults) insertCategory.run(name, type);
}

const jointCount = db.prepare('SELECT COUNT(*) AS count FROM joint_account').get();
if (jointCount.count === 0) {
  db.prepare('INSERT INTO joint_account (balance, last_updated) VALUES (0, ?)').run(new Date().toISOString());
}

export default db;
