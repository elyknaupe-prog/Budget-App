import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const categories = db
    .prepare('SELECT * FROM categories ORDER BY type, name')
    .all();
  res.json(categories);
});

router.post('/', (req, res) => {
  const { type, name } = req.body;
  if (!type || !name) {
    return res.status(400).json({ error: 'type and name are required' });
  }
  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: "type must be 'income' or 'expense'" });
  }

  try {
    const result = db
      .prepare('INSERT INTO categories (type, name) VALUES (?, ?)')
      .run(type, name.trim());
    const category = db
      .prepare('SELECT * FROM categories WHERE id = ?')
      .get(result.lastInsertRowid);
    res.status(201).json(category);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'category already exists' });
    }
    throw err;
  }
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'category not found' });
  }
  res.status(204).end();
});

export default router;
