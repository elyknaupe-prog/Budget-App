import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM joint_account ORDER BY id DESC LIMIT 1').get());
});

router.patch('/', (req, res) => {
  const { balance } = req.body;
  if (balance == null) return res.status(400).json({ error: 'balance is required' });

  const account = db.prepare('SELECT * FROM joint_account ORDER BY id DESC LIMIT 1').get();
  db.prepare('UPDATE joint_account SET balance = ?, last_updated = ? WHERE id = ?').run(
    balance,
    new Date().toISOString(),
    account.id
  );
  res.json(db.prepare('SELECT * FROM joint_account WHERE id = ?').get(account.id));
});

export default router;
