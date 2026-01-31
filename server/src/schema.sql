PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  user_id TEXT NOT NULL,
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('income','expense')),
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, id),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transactions (
  user_id TEXT NOT NULL,
  id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('income','expense')),
  amount REAL NOT NULL,
  date TEXT NOT NULL,
  merchant TEXT,
  notes TEXT,
  tags_json TEXT NOT NULL,
  is_recurring INTEGER NOT NULL DEFAULT 0,
  recurring_rule TEXT,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, id),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(user_id, category_id) REFERENCES categories(user_id, id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS budgets (
  user_id TEXT NOT NULL,
  id TEXT NOT NULL,
  category_id TEXT,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  amount REAL NOT NULL,
  rollover_enabled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, id),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(user_id, category_id) REFERENCES categories(user_id, id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS settings (
  user_id TEXT PRIMARY KEY,
  currency TEXT NOT NULL,
  first_day_of_month INTEGER NOT NULL,
  theme TEXT NOT NULL CHECK(theme IN ('light','dark','system')),
  updated_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
