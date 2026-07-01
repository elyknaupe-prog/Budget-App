import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const account = db.prepare('SELECT * FROM joint_account WHERE id = 1').get();
  res.json(account);
});

router.put('/', (req, res) => {
  const { balance } = req.body;
  if (typeof balance !== 'number') {
    return res.status(400).json({ error: 'balance must be a number' });
  }
  db.prepare(
    `UPDATE joint_account SET balance = ?, last_updated = datetime('now') WHERE id = 1`
  ).run(balance);
  const account = db.prepare('SELECT * FROM joint_account WHERE id = 1').get();
  res.json(account);
});

router.get('/contributions', (req, res) => {
  const rows = db
    .prepare(
      `SELECT contributions.*, users.name as user_name
       FROM contributions
       JOIN users ON users.id = contributions.user_id
       ORDER BY date DESC, contributions.id DESC`
    )
    .all();
  res.json(rows);
});

router.post('/contributions', (req, res) => {
  const { user_id, amount, date, note } = req.body;
  if (!user_id || !amount || !date) {
    return res.status(400).json({ error: 'user_id, amount, and date are required' });
  }

  const result = db
    .prepare(
      'INSERT INTO contributions (user_id, amount, date, note) VALUES (?, ?, ?, ?)'
    )
    .run(user_id, amount, date, note ?? null);

  db.prepare(
    `UPDATE joint_account SET balance = balance + ?, last_updated = datetime('now') WHERE id = 1`
  ).run(amount);

  const contribution = db
    .prepare(
      `SELECT contributions.*, users.name as user_name
       FROM contributions JOIN users ON users.id = contributions.user_id
       WHERE contributions.id = ?`
    )
    .get(result.lastInsertRowid);
  res.status(201).json(contribution);
});

export default router;
