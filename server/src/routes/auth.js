import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../db.js';
import { seedUserIfEmpty } from '../seed.js';
import { requireAuth } from '../middleware.js';

export const authRouter = express.Router();

function signToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

authRouter.post('/register', async (req, res) => {
  const { email, password, fullName } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'email/password required' });

  const exists = db.prepare('SELECT 1 FROM users WHERE email=?').get(email);
  if (exists) return res.status(409).json({ message: 'Email already exists' });

  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();
  const password_hash = await bcrypt.hash(password, 10);

  db.prepare('INSERT INTO users (id, email, password_hash, full_name, created_at) VALUES (?,?,?,?,?)')
    .run(id, email, password_hash, (fullName || '').trim() || null, created_at);

  seedUserIfEmpty(id);

  const user = { id, email, name: (fullName || '').trim() || email.split('@')[0] || 'User' };
  const token = signToken({ id, email });

  res.json({ token, user });
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'email/password required' });

  const row = db.prepare('SELECT id, email, password_hash, full_name FROM users WHERE email=?').get(email);
  if (!row) return res.status(401).json({ message: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  seedUserIfEmpty(row.id);

  const token = signToken({ id: row.id, email: row.email });
  const user = { id: row.id, email: row.email, name: row.full_name || row.email.split('@')[0] || 'User' };

  res.json({ token, user });
});

authRouter.get('/me', requireAuth, (req, res) => {
  const row = db.prepare('SELECT id, email, full_name FROM users WHERE id=?').get(req.user.userId);
  if (!row) return res.status(404).json({ message: 'User not found' });
  res.json({ id: row.id, email: row.email, name: row.full_name || row.email.split('@')[0] || 'User' });
});
