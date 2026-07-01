import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext.jsx';
import { api } from '../api.js';
import SpendingByCategoryChart from '../components/SpendingByCategoryChart.jsx';
import SpendingTrendChart from '../components/SpendingTrendChart.jsx';

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default function PersonalDashboard() {
  const { activeUser } = useProfile();
  const [month, setMonth] = useState(currentMonth());
  const [transactions, setTransactions] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!activeUser) return;
    setLoading(true);
    setError('');
    Promise.all([
      api.getTransactions({ user_id: activeUser.id, month }),
      api.getTransactionSummary(activeUser.id, 6),
    ])
      .then(([txns, summary]) => {
        setTransactions(txns);
        setTrend(summary);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [activeUser, month]);

  const { income, expenses, surplus, byCategory } = useMemo(() => {
    let income = 0;
    let expenses = 0;
    const categoryMap = new Map();

    for (const t of transactions) {
      if (t.type === 'income') {
        income += t.amount;
      } else {
        expenses += t.amount;
        categoryMap.set(t.category, (categoryMap.get(t.category) ?? 0) + t.amount);
      }
    }

    return {
      income,
      expenses,
      surplus: income - expenses,
      byCategory: Array.from(categoryMap, ([category, amount]) => ({ category, amount })),
    };
  }, [transactions]);

  const handleDelete = async (id) => {
    await api.deleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  if (!activeUser) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-800">{activeUser.name}'s Dashboard</h1>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          />
          <Link
            to="/transactions/new"
            className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            + Add Transaction
          </Link>
        </div>
      </div>

      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Income</p>
          <p className="text-2xl font-semibold text-emerald-600">${income.toFixed(2)}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Expenses</p>
          <p className="text-2xl font-semibold text-rose-600">${expenses.toFixed(2)}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Surplus</p>
          <p className={`text-2xl font-semibold ${surplus >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            ${surplus.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="mb-2 font-semibold text-slate-700">Spending by Category</h2>
          <SpendingByCategoryChart data={byCategory} />
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="mb-2 font-semibold text-slate-700">Spending Trend (6 mo)</h2>
          <SpendingTrendChart data={trend} />
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-700">Transactions for {month}</h2>
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-slate-500">No transactions logged for this month.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2">Date</th>
                <th>Category</th>
                <th>Note</th>
                <th className="text-right">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-b border-slate-100">
                  <td className="py-2">{t.date}</td>
                  <td>
                    {t.category}
                    {t.recurring ? (
                      <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                        recurring
                      </span>
                    ) : null}
                  </td>
                  <td className="text-slate-500">{t.note}</td>
                  <td className={`text-right font-medium ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                  </td>
                  <td className="text-right">
                    <Link to={`/transactions/${t.id}/edit`} className="mr-2 text-xs text-slate-500 hover:text-slate-800">
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="text-xs text-rose-500 hover:text-rose-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
