import { db } from './db.js';

export function seedUserIfEmpty(userId) {
  const catCount = db.prepare('SELECT COUNT(1) AS c FROM categories WHERE user_id=?').get(userId).c;
  const hasSettings = db.prepare('SELECT 1 FROM settings WHERE user_id=?').get(userId);
  if (catCount > 0 && hasSettings) return;

  const now = new Date().toISOString();

  if (!hasSettings) {
    db.prepare(
      'INSERT INTO settings (user_id, currency, first_day_of_month, theme, updated_at) VALUES (?,?,?,?,?)'
    ).run(userId, 'VND', 1, 'system', now);
  }

  if (catCount === 0) {
    const categories = [
      { id: 'dining', name: 'Ăn Uống', type: 'expense', color: '#ef4444', icon: 'food' },
      { id: 'transport', name: 'Giao Thông', type: 'expense', color: '#3b82f6', icon: 'transport' },
      { id: 'groceries', name: 'Tạp Hóa', type: 'expense', color: '#10b981', icon: 'shopping' },
      { id: 'entertainment', name: 'Giải Trí', type: 'expense', color: '#8b5cf6', icon: 'entertainment' },
      { id: 'utilities', name: 'Tiện Ích', type: 'expense', color: '#f59e0b', icon: 'utilities' },
      { id: 'healthcare', name: 'Y Tế', type: 'expense', color: '#ec4899', icon: 'health' },
      { id: 'salary', name: 'Lương', type: 'income', color: '#10b981', icon: 'salary' },
      { id: 'freelance', name: 'Tự Do', type: 'income', color: '#06b6d4', icon: 'freelance' }
    ];

    const insert = db.prepare(
      'INSERT INTO categories (user_id, id, name, type, color, icon, created_at) VALUES (?,?,?,?,?,?,?)'
    );
    const tx = db.transaction(() => {
      for (const c of categories) insert.run(userId, c.id, c.name, c.type, c.color, c.icon, now);
    });
    tx();
  }
}

export function resetUserData(userId) {
  const now = new Date().toISOString();
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM transactions WHERE user_id=?').run(userId);
    db.prepare('DELETE FROM budgets WHERE user_id=?').run(userId);
    db.prepare('DELETE FROM categories WHERE user_id=?').run(userId);
    db.prepare('DELETE FROM settings WHERE user_id=?').run(userId);
  });
  tx();
  seedUserIfEmpty(userId);
  // also create some example transactions? Keep empty by default.
  db.prepare('UPDATE settings SET updated_at=? WHERE user_id=?').run(now, userId);
}
