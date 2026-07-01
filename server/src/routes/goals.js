import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM goals ORDER BY priority, id').all());
});

router.post('/', (req, res) => {
  const { name, target_amount, target_date, current_amount, priority } = req.body;
  if (!name || target_amount == null) {
    return res.status(400).json({ error: 'name and target_amount are required' });
  }

  const result = db
    .prepare(
      'INSERT INTO goals (name, target_amount, target_date, current_amount, priority) VALUES (?, ?, ?, ?, ?)'
    )
    .run(name, target_amount, target_date ?? null, current_amount ?? 0, priority ?? 1);

  res.status(201).json(db.prepare('SELECT * FROM goals WHERE id = ?').get(result.lastInsertRowid));
});

router.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM goals WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Goal not found' });

  const { name, target_amount, target_date, current_amount, priority } = req.body;
  db.prepare(
    'UPDATE goals SET name = ?, target_amount = ?, target_date = ?, current_amount = ?, priority = ? WHERE id = ?'
  ).run(
    name ?? existing.name,
    target_amount ?? existing.target_amount,
    target_date !== undefined ? target_date : existing.target_date,
    current_amount != null ? current_amount : existing.current_amount,
    priority ?? existing.priority,
    req.params.id
  );

  res.json(db.prepare('SELECT * FROM goals WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM goals WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
