import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const goals = db
    .prepare('SELECT * FROM goals ORDER BY priority ASC, id ASC')
    .all();
  res.json(goals);
});

router.post('/', (req, res) => {
  const { name, target_amount, target_date, current_amount, priority } = req.body;
  if (!name || !target_amount) {
    return res.status(400).json({ error: 'name and target_amount are required' });
  }

  const result = db
    .prepare(
      `INSERT INTO goals (name, target_amount, target_date, current_amount, priority)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(
      name,
      target_amount,
      target_date ?? null,
      current_amount ?? 0,
      priority ?? 0
    );

  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(goal);
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'goal not found' });
  }

  const {
    name = existing.name,
    target_amount = existing.target_amount,
    target_date = existing.target_date,
    current_amount = existing.current_amount,
    priority = existing.priority,
  } = req.body;

  db.prepare(
    `UPDATE goals
     SET name = ?, target_amount = ?, target_date = ?, current_amount = ?, priority = ?
     WHERE id = ?`
  ).run(name, target_amount, target_date, current_amount, priority, id);

  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
  res.json(goal);
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const result = db.prepare('DELETE FROM goals WHERE id = ?').run(id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'goal not found' });
  }
  res.status(204).end();
});

export default router;
