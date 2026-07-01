import express from 'express';
import cors from 'cors';
import './db.js';
import usersRouter from './routes/users.js';
import categoriesRouter from './routes/categories.js';
import transactionsRouter from './routes/transactions.js';
import jointAccountRouter from './routes/jointAccount.js';
import contributionsRouter from './routes/contributions.js';
import goalsRouter from './routes/goals.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/joint-account', jointAccountRouter);
app.use('/api/contributions', contributionsRouter);
app.use('/api/goals', goalsRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Budget app API listening on http://localhost:${PORT}`);
});
