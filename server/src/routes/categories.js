import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM categories ORDER BY type, name').all());
});

router.post('/', (req, res) => {
  const { name, type } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'name and type are required' });
  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'type must be income or expense' });
  }
  try {
    const result = db.prepare('INSERT INTO categories (name, type) VALUES (?, ?)').run(name, type);
    res.status(201).json(db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid));
  } catch {
    res.status(409).json({ error: 'Category already exists' });
  }
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
