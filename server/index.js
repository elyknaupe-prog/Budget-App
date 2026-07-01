import express from 'express';
import cors from 'cors';
import usersRouter from './routes/users.js';
import transactionsRouter from './routes/transactions.js';
import jointRouter from './routes/joint.js';
import goalsRouter from './routes/goals.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/joint', jointRouter);
app.use('/api/goals', goalsRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'internal server error' });
});

app.listen(PORT, () => {
  console.log(`Budget App API listening on http://localhost:${PORT}`);
});
