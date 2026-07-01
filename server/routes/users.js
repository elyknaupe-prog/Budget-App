import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const users = db.prepare('SELECT * FROM users ORDER BY id').all();
  res.json(users);
});

router.post('/', (req, res) => {
  const { name, email, savings_rate_target } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' });
  }
  try {
    const result = db
      .prepare(
        'INSERT INTO users (name, email, savings_rate_target) VALUES (?, ?, ?)'
      )
      .run(name, email, savings_rate_target ?? 20);
    const user = db
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(result.lastInsertRowid);
    res.status(201).json(user);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'email already in use' });
    }
    throw err;
  }
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'user not found' });
  }

  const {
    name = existing.name,
    email = existing.email,
    savings_rate_target = existing.savings_rate_target,
  } = req.body;

  try {
    db.prepare(
      'UPDATE users SET name = ?, email = ?, savings_rate_target = ? WHERE id = ?'
    ).run(name, email, savings_rate_target, id);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'email already in use' });
    }
    throw err;
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  res.json(user);
});

export default router;
