import { useEffect, useState, useCallback } from 'react';
import { useProfile } from '../lib/ProfileContext.jsx';
import { api } from '../lib/api.js';
import { currentMonth, formatMoney } from '../lib/categories.js';
import SummaryCard from '../components/SummaryCard.jsx';
import TransactionForm from '../components/TransactionForm.jsx';
import TransactionList from '../components/TransactionList.jsx';
import CategoryBarChart from '../components/CategoryBarChart.jsx';
import TrendChart from '../components/TrendChart.jsx';

export default function PersonalDashboard() {
  const { activeUser } = useProfile();
  const [month, setMonth] = useState(currentMonth());
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [trend, setTrend] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!activeUser) return;
    const [s, t, tr] = await Promise.all([
      api.getSummary(activeUser.id, month),
      api.getTransactions(activeUser.id, month),
      api.getTrend(activeUser.id, 6),
    ]);
    setSummary(s);
    setTransactions(t);
    setTrend(tr);
  }, [activeUser, month]);

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [load]);

  const handleCreate = async (data) => {
    await api.createTransaction({ ...data, user_id: activeUser.id });
    setShowForm(false);
    await load();
  };

  const handleUpdate = async (data) => {
    await api.updateTransaction(editing.id, data);
    setEditing(null);
    await load();
  };

  const handleDelete = async (t) => {
    if (!confirm(`Delete ${t.category} · ${formatMoney(t.amount)}?`)) return;
    await api.deleteTransaction(t.id);
    await load();
  };

  if (!activeUser) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">{activeUser.name}'s Dashboard</h1>
          <p className="text-sm text-slate-500">Income, expenses, and surplus for the month.</p>
        </div>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="px-3 py-1.5 rounded-md border border-slate-300 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <SummaryCard label="Income" amount={summary.income} tone="positive" />
          <SummaryCard label="Expenses" amount={summary.expenses} tone="negative" />
          <SummaryCard
            label="Surplus"
            amount={summary.surplus}
            tone={summary.surplus >= 0 ? 'positive' : 'negative'}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {summary && summary.byCategory.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Spending by category</h2>
            <CategoryBarChart data={summary.byCategory} />
          </div>
        )}

        {trend.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Trend (last 6 months)</h2>
            <TrendChart data={trend} />
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700">Transactions</h2>
          {!showForm && !editing && (
            <button
              onClick={() => setShowForm(true)}
              className="px-3 py-1.5 text-sm rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              Add transaction
            </button>
          )}
        </div>

        {showForm && (
          <div className="mb-4">
            <TransactionForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
          </div>
        )}

        {editing && (
          <div className="mb-4">
            <TransactionForm
              initial={{
                type: editing.type,
                category: editing.category,
                amount: editing.amount,
                date: editing.date,
                recurring: !!editing.recurring,
                note: editing.note || '',
              }}
              onSubmit={handleUpdate}
              onCancel={() => setEditing(null)}
            />
          </div>
        )}

        <div className="bg-white rounded-lg border border-slate-200 px-4">
          <TransactionList
            transactions={transactions}
            onEdit={(t) => {
              setShowForm(false);
              setEditing(t);
            }}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}
