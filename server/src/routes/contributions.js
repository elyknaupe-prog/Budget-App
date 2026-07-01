import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  res.json(
    db
      .prepare(
        `SELECT contributions.*, users.name AS user_name
         FROM contributions
         JOIN users ON users.id = contributions.user_id
         ORDER BY date DESC, contributions.id DESC`
      )
      .all()
  );
});

router.post('/', (req, res) => {
  const { user_id, amount, date, note } = req.body;
  if (!user_id || amount == null || !date) {
    return res.status(400).json({ error: 'user_id, amount, date are required' });
  }

  const insertContribution = db.transaction(() => {
    const result = db
      .prepare('INSERT INTO contributions (user_id, amount, date, note) VALUES (?, ?, ?, ?)')
      .run(user_id, amount, date, note ?? null);

    const account = db.prepare('SELECT * FROM joint_account ORDER BY id DESC LIMIT 1').get();
    db.prepare('UPDATE joint_account SET balance = balance + ?, last_updated = ? WHERE id = ?').run(
      amount,
      new Date().toISOString(),
      account.id
    );

    return result.lastInsertRowid;
  });

  const id = insertContribution();
  res.status(201).json(
    db
      .prepare(
        `SELECT contributions.*, users.name AS user_name
         FROM contributions JOIN users ON users.id = contributions.user_id
         WHERE contributions.id = ?`
      )
      .get(id)
  );
});

router.delete('/:id', (req, res) => {
  const contribution = db.prepare('SELECT * FROM contributions WHERE id = ?').get(req.params.id);
  if (!contribution) return res.status(404).json({ error: 'Contribution not found' });

  const deleteContribution = db.transaction(() => {
    db.prepare('DELETE FROM contributions WHERE id = ?').run(req.params.id);
    const account = db.prepare('SELECT * FROM joint_account ORDER BY id DESC LIMIT 1').get();
    db.prepare('UPDATE joint_account SET balance = balance - ?, last_updated = ? WHERE id = ?').run(
      contribution.amount,
      new Date().toISOString(),
      account.id
    );
  });
  deleteContribution();

  res.status(204).end();
});

export default router;
