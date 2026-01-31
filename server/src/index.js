import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { initDb } from './db.js';
import { authRouter } from './routes/auth.js';
import { financeRouter } from './routes/finance.js';

initDb();

const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/finance', financeRouter);

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`✅ FineBank API running on http://localhost:${port}`);
});
