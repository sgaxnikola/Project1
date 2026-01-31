import express from 'express';
import crypto from 'crypto';
import { db } from '../db.js';
import { requireAuth } from '../middleware.js';
import { resetUserData, seedUserIfEmpty } from '../seed.js';

export const financeRouter = express.Router();

financeRouter.use(requireAuth);

function jsonParseSafe(raw, fallback) {
  try {
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

financeRouter.get('/state', (req, res) => {
  const userId = req.user.userId;
  seedUserIfEmpty(userId);

  const categories = db.prepare(
    'SELECT id, name, type, color, icon FROM categories WHERE user_id=?'
  ).all(userId);

  const transactions = db.prepare(
    `SELECT id, category_id as categoryId, type, amount, date, merchant, notes, tags_json, is_recurring, recurring_rule
     FROM transactions WHERE user_id=? ORDER BY date DESC`
  ).all(userId).map(row => ({
    id: row.id,
    categoryId: row.categoryId,
    type: row.type,
    amount: row.amount,
    date: row.date,
    merchant: row.merchant ?? undefined,
    notes: row.notes ?? undefined,
    tags: jsonParseSafe(row.tags_json, []),
    isRecurring: Boolean(row.is_recurring),
    recurringRule: row.recurring_rule ?? undefined,
  }));

  const budgets = db.prepare(
    'SELECT id, category_id as categoryId, month, year, amount, rollover_enabled FROM budgets WHERE user_id=?'
  ).all(userId).map(row => ({
    id: row.id,
    categoryId: row.categoryId ?? undefined,
    month: row.month,
    year: row.year,
    amount: row.amount,
    rolloverEnabled: Boolean(row.rollover_enabled)
  }));

  const settingsRow = db.prepare(
    'SELECT currency, first_day_of_month as firstDayOfMonth, theme FROM settings WHERE user_id=?'
  ).get(userId);

  const settings = settingsRow ?? { currency: 'VND', firstDayOfMonth: 1, theme: 'system' };

  res.json({ categories, transactions, budgets, settings });
});

financeRouter.post('/reset', (req, res) => {
  const userId = req.user.userId;
  resetUserData(userId);
  res.json({ ok: true });
});

// Settings (except OpenAI key; keep that on client for safety)
financeRouter.patch('/settings', (req, res) => {
  const userId = req.user.userId;
  const { currency, firstDayOfMonth, theme } = req.body || {};

  const existing = db.prepare('SELECT 1 FROM settings WHERE user_id=?').get(userId);
  const now = new Date().toISOString();

  if (!existing) {
    db.prepare(
      'INSERT INTO settings (user_id, currency, first_day_of_month, theme, updated_at) VALUES (?,?,?,?,?)'
    ).run(userId, currency || 'VND', firstDayOfMonth || 1, theme || 'system', now);
  } else {
    const current = db.prepare('SELECT currency, first_day_of_month, theme FROM settings WHERE user_id=?').get(userId);
    db.prepare(
      'UPDATE settings SET currency=?, first_day_of_month=?, theme=?, updated_at=? WHERE user_id=?'
    ).run(
      currency ?? current.currency,
      firstDayOfMonth ?? current.first_day_of_month,
      theme ?? current.theme,
      now,
      userId
    );
  }

  res.json({ ok: true });
});

// Categories
financeRouter.post('/categories', (req, res) => {
  const userId = req.user.userId;
  const { id, name, type, color, icon } = req.body || {};
  if (!id || !name || !type || !color || !icon) return res.status(400).json({ message: 'Missing fields' });

  const exists = db.prepare('SELECT 1 FROM categories WHERE user_id=? AND id=?').get(userId, id);
  if (exists) return res.status(409).json({ message: 'Category already exists' });

  db.prepare(
    'INSERT INTO categories (user_id, id, name, type, color, icon, created_at) VALUES (?,?,?,?,?,?,?)'
  ).run(userId, id, name, type, color, icon, new Date().toISOString());

  res.json({ ok: true });
});

financeRouter.put('/categories/:id', (req, res) => {
  const userId = req.user.userId;
  const id = req.params.id;

  const current = db.prepare('SELECT * FROM categories WHERE user_id=? AND id=?').get(userId, id);
  if (!current) return res.status(404).json({ message: 'Not found' });

  const { name, type, color, icon } = req.body || {};
  db.prepare('UPDATE categories SET name=?, type=?, color=?, icon=? WHERE user_id=? AND id=?').run(
    name ?? current.name,
    type ?? current.type,
    color ?? current.color,
    icon ?? current.icon,
    userId,
    id
  );

  res.json({ ok: true });
});

financeRouter.delete('/categories/:id', (req, res) => {
  const userId = req.user.userId;
  const id = req.params.id;

  // If there are transactions referencing the category, SQLite will restrict.
  try {
    db.prepare('DELETE FROM categories WHERE user_id=? AND id=?').run(userId, id);
    res.json({ ok: true });
  } catch (e) {
    return res.status(409).json({ message: 'Category is in use' });
  }
});

// Transactions
financeRouter.post('/transactions', (req, res) => {
  const userId = req.user.userId;
  const body = req.body || {};

  const id = body.id || crypto.randomUUID();
  const {
    categoryId,
    type,
    amount,
    date,
    merchant,
    notes,
    tags,
    isRecurring,
    recurringRule
  } = body;

  if (!categoryId || !type || typeof amount !== 'number' || !date) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  db.prepare(
    `INSERT INTO transactions
      (user_id, id, category_id, type, amount, date, merchant, notes, tags_json, is_recurring, recurring_rule, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(
    userId,
    id,
    categoryId,
    type,
    amount,
    date,
    merchant ?? null,
    notes ?? null,
    JSON.stringify(Array.isArray(tags) ? tags : []),
    isRecurring ? 1 : 0,
    recurringRule ?? null,
    new Date().toISOString()
  );

  res.json({ id });
});

financeRouter.put('/transactions/:id', (req, res) => {
  const userId = req.user.userId;
  const id = req.params.id;

  const current = db.prepare('SELECT * FROM transactions WHERE user_id=? AND id=?').get(userId, id);
  if (!current) return res.status(404).json({ message: 'Not found' });

  const body = req.body || {};
  const next = {
    category_id: body.categoryId ?? current.category_id,
    type: body.type ?? current.type,
    amount: typeof body.amount === 'number' ? body.amount : current.amount,
    date: body.date ?? current.date,
    merchant: body.merchant ?? current.merchant,
    notes: body.notes ?? current.notes,
    tags_json: body.tags ? JSON.stringify(body.tags) : current.tags_json,
    is_recurring: typeof body.isRecurring === 'boolean' ? (body.isRecurring ? 1 : 0) : current.is_recurring,
    recurring_rule: body.recurringRule ?? current.recurring_rule,
  };

  db.prepare(
    `UPDATE transactions
     SET category_id=?, type=?, amount=?, date=?, merchant=?, notes=?, tags_json=?, is_recurring=?, recurring_rule=?
     WHERE user_id=? AND id=?`
  ).run(
    next.category_id,
    next.type,
    next.amount,
    next.date,
    next.merchant,
    next.notes,
    next.tags_json,
    next.is_recurring,
    next.recurring_rule,
    userId,
    id
  );

  res.json({ ok: true });
});

financeRouter.delete('/transactions/:id', (req, res) => {
  const userId = req.user.userId;
  const id = req.params.id;
  db.prepare('DELETE FROM transactions WHERE user_id=? AND id=?').run(userId, id);
  res.json({ ok: true });
});

// Budgets (upsert by categoryId+month+year)
financeRouter.put('/budgets', (req, res) => {
  const userId = req.user.userId;
  const { categoryId, month, year, amount, rolloverEnabled } = req.body || {};
  if (!month || !year || typeof amount !== 'number') return res.status(400).json({ message: 'Missing fields' });

  const key = `${year}-${month}-${categoryId || 'overall'}`;
  const now = new Date().toISOString();

  // delete then insert to keep logic simple
  db.prepare('DELETE FROM budgets WHERE user_id=? AND id=?').run(userId, key);
  db.prepare(
    'INSERT INTO budgets (user_id, id, category_id, month, year, amount, rollover_enabled, created_at) VALUES (?,?,?,?,?,?,?,?)'
  ).run(userId, key, categoryId || null, month, year, amount, rolloverEnabled ? 1 : 0, now);

  res.json({ id: key });
});
