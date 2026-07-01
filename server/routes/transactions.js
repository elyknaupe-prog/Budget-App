import { Router } from 'express';
import db from '../db.js';

const router = Router();

function monthBounds(month) {
  // month is 'YYYY-MM'; end is the first day of the following month
  const [year, m] = month.split('-').map(Number);
  const end = new Date(Date.UTC(year, m, 1)).toISOString().slice(0, 10);
  return { start: `${month}-01`, end };
}

router.get('/', (req, res) => {
  const { user_id, month } = req.query;
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  if (month) {
    const { end } = monthBounds(month);
    const rows = db
      .prepare(
        `SELECT * FROM transactions
         WHERE user_id = ?
           AND (
             (recurring = 0 AND strftime('%Y-%m', date) = ?)
             OR (recurring = 1 AND date < ?)
           )
         ORDER BY date DESC`
      )
      .all(user_id, month, end);
    return res.json(rows);
  }

  const rows = db
    .prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC')
    .all(user_id);
  res.json(rows);
});

router.get('/summary/:userId', (req, res) => {
  const { userId } = req.params;
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const { end } = monthBounds(month);

  const totals = db
    .prepare(
      `SELECT type, COALESCE(SUM(amount), 0) as total FROM transactions
       WHERE user_id = ?
         AND (
           (recurring = 0 AND strftime('%Y-%m', date) = ?)
           OR (recurring = 1 AND date < ?)
         )
       GROUP BY type`
    )
    .all(userId, month, end);

  const income = totals.find((t) => t.type === 'income')?.total ?? 0;
  const expenses = totals.find((t) => t.type === 'expense')?.total ?? 0;

  const byCategory = db
    .prepare(
      `SELECT category, COALESCE(SUM(amount), 0) as total FROM transactions
       WHERE user_id = ? AND type = 'expense'
         AND (
           (recurring = 0 AND strftime('%Y-%m', date) = ?)
           OR (recurring = 1 AND date < ?)
         )
       GROUP BY category
       ORDER BY total DESC`
    )
    .all(userId, month, end);

  res.json({
    month,
    income,
    expenses,
    surplus: income - expenses,
    byCategory,
  });
});

router.post('/', (req, res) => {
  const { user_id, type, category, amount, date, recurring, note } = req.body;
  if (!user_id || !type || !category || !amount || !date) {
    return res
      .status(400)
      .json({ error: 'user_id, type, category, amount, and date are required' });
  }
  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: "type must be 'income' or 'expense'" });
  }

  const result = db
    .prepare(
      `INSERT INTO transactions (user_id, type, category, amount, date, recurring, note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(user_id, type, category, amount, date, recurring ? 1 : 0, note ?? null);

  const transaction = db
    .prepare('SELECT * FROM transactions WHERE id = ?')
    .get(result.lastInsertRowid);
  res.status(201).json(transaction);
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'transaction not found' });
  }

  const {
    type = existing.type,
    category = existing.category,
    amount = existing.amount,
    date = existing.date,
    recurring = existing.recurring,
    note = existing.note,
  } = req.body;

  db.prepare(
    `UPDATE transactions
     SET type = ?, category = ?, amount = ?, date = ?, recurring = ?, note = ?
     WHERE id = ?`
  ).run(type, category, amount, date, recurring ? 1 : 0, note, id);

  const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
  res.json(transaction);
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const result = db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'transaction not found' });
  }
  res.status(204).end();
});

export default router;
