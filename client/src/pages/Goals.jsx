import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import GoalProgressBar from '../components/GoalProgressBar.jsx';

const emptyForm = { name: '', target_amount: '', target_date: '', current_amount: '', priority: 1 };

function monthsAgo(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 7);
}

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    api.getGoals().then(setGoals);
    api.getContributions().then(setContributions);
  };

  useEffect(load, []);

  const avgMonthlyContribution = useMemo(() => {
    const windowMonths = new Set([monthsAgo(0), monthsAgo(1), monthsAgo(2)]);
    const total = contributions
      .filter((c) => windowMonths.has(c.date.slice(0, 7)))
      .reduce((sum, c) => sum + c.amount, 0);
    return total / 3;
  }, [contributions]);

  const startCreate = () => {
    setEditingId('new');
    setForm(emptyForm);
  };

  const startEdit = (goal) => {
    setEditingId(goal.id);
    setForm({
      name: goal.name,
      target_amount: String(goal.target_amount),
      target_date: goal.target_date ?? '',
      current_amount: String(goal.current_amount),
      priority: goal.priority,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.target_amount) {
      setError('Name and target amount are required.');
      return;
    }
    const payload = {
      name: form.name,
      target_amount: Number(form.target_amount),
      target_date: form.target_date || null,
      current_amount: Number(form.current_amount) || 0,
      priority: Number(form.priority) || 1,
    };
    try {
      if (editingId === 'new') {
        await api.addGoal(payload);
      } else {
        await api.updateGoal(editingId, payload);
      }
      cancelEdit();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    await api.deleteGoal(id);
    load();
  };

  const projection = (goal) => {
    const remaining = goal.target_amount - goal.current_amount;
    if (remaining <= 0) return 'Goal reached!';
    if (avgMonthlyContribution <= 0) return null;
    const monthsLeft = Math.ceil(remaining / avgMonthlyContribution);
    const eta = new Date();
    eta.setMonth(eta.getMonth() + monthsLeft);
    return `At current pace (~$${avgMonthlyContribution.toFixed(0)}/mo), you'd hit this around ${eta.toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
    })}.`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Investment Goals</h1>
        {editingId === null && (
          <button
            onClick={startCreate}
            className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            + New Goal
          </button>
        )}
      </div>

      {editingId !== null && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-lg bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-700">{editingId === 'new' ? 'New Goal' : 'Edit Goal'}</h2>
          <input
            type="text"
            placeholder="Name (e.g. Emergency fund)"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              step="0.01"
              placeholder="Target amount"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={form.target_amount}
              onChange={(e) => setForm((f) => ({ ...f, target_amount: e.target.value }))}
            />
            <input
              type="number"
              step="0.01"
              placeholder="Current amount"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={form.current_amount}
              onChange={(e) => setForm((f) => ({ ...f, current_amount: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={form.target_date}
              onChange={(e) => setForm((f) => ({ ...f, target_date: e.target.value }))}
            />
            <input
              type="number"
              min="1"
              placeholder="Priority (1 = highest)"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
              Save
            </button>
            <button type="button" onClick={cancelEdit} className="rounded border border-slate-300 px-4 py-2 text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {goals.length === 0 ? (
          <p className="text-sm text-slate-500">No goals yet. Create one to start tracking progress.</p>
        ) : (
          goals.map((goal) => (
            <div key={goal.id} className="rounded-lg bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">{goal.name}</h3>
                  {goal.target_date && (
                    <p className="text-xs text-slate-400">Target date: {goal.target_date}</p>
                  )}
                </div>
                <div className="flex gap-2 text-xs">
                  <button onClick={() => startEdit(goal)} className="text-slate-500 hover:text-slate-800">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(goal.id)} className="text-rose-500 hover:text-rose-700">
                    Delete
                  </button>
                </div>
              </div>
              <GoalProgressBar current={goal.current_amount} target={goal.target_amount} />
              {projection(goal) && <p className="mt-2 text-xs text-slate-500">{projection(goal)}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
