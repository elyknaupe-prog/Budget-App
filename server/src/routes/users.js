import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const users = db.prepare('SELECT * FROM users ORDER BY id').all();
  res.json(users);
});

router.patch('/:id', (req, res) => {
  const { name, savings_rate_target } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  db.prepare('UPDATE users SET name = ?, savings_rate_target = ? WHERE id = ?').run(
    name ?? user.name,
    savings_rate_target ?? user.savings_rate_target,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id));
});

export default router;
