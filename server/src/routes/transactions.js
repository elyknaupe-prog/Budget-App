import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const { user_id, month } = req.query;
  let query = 'SELECT * FROM transactions WHERE 1=1';
  const params = [];

  if (user_id) {
    query += ' AND user_id = ?';
    params.push(user_id);
  }
  if (month) {
    query += ' AND date LIKE ?';
    params.push(`${month}%`);
  }
  query += ' ORDER BY date DESC, id DESC';

  res.json(db.prepare(query).all(...params));
});

router.get('/summary', (req, res) => {
  const { user_id, months = 6 } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });

  const rows = db
    .prepare(
      `SELECT substr(date, 1, 7) AS month,
              SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
              SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expenses
       FROM transactions
       WHERE user_id = ?
       GROUP BY month
       ORDER BY month DESC
       LIMIT ?`
    )
    .all(user_id, Number(months));

  res.json(rows.reverse());
});

router.get('/:id', (req, res) => {
  const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
  if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
  res.json(transaction);
});

router.post('/', (req, res) => {
  const { user_id, type, category, amount, date, recurring, note } = req.body;
  if (!user_id || !type || !category || amount == null || !date) {
    return res.status(400).json({ error: 'user_id, type, category, amount, date are required' });
  }
  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'type must be income or expense' });
  }

  const result = db
    .prepare(
      'INSERT INTO transactions (user_id, type, category, amount, date, recurring, note) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run(user_id, type, category, amount, date, recurring ? 1 : 0, note ?? null);

  res.status(201).json(db.prepare('SELECT * FROM transactions WHERE id = ?').get(result.lastInsertRowid));
});

router.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Transaction not found' });

  const { type, category, amount, date, recurring, note } = req.body;
  db.prepare(
    'UPDATE transactions SET type = ?, category = ?, amount = ?, date = ?, recurring = ?, note = ? WHERE id = ?'
  ).run(
    type ?? existing.type,
    category ?? existing.category,
    amount ?? existing.amount,
    date ?? existing.date,
    recurring != null ? (recurring ? 1 : 0) : existing.recurring,
    note !== undefined ? note : existing.note,
    req.params.id
  );

  res.json(db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM transactions WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
