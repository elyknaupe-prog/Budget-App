import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api.js';
import { formatMoney } from '../lib/categories.js';
import GoalForm from '../components/GoalForm.jsx';

function ProgressBar({ value }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
      <div
        className="h-full bg-emerald-500 rounded-full transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const data = await api.getGoals();
    setGoals(data);
  }, []);

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [load]);

  const handleCreate = async (data) => {
    await api.createGoal(data);
    setShowForm(false);
    await load();
  };

  const handleUpdate = async (data) => {
    await api.updateGoal(editing.id, data);
    setEditing(null);
    await load();
  };

  const handleDelete = async (goal) => {
    if (!confirm(`Delete goal "${goal.name}"?`)) return;
    await api.deleteGoal(goal.id);
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Goals</h1>
          <p className="text-sm text-slate-500">Shared savings and investing goals.</p>
        </div>
        {!showForm && !editing && (
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1.5 text-sm rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          >
            Add goal
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {showForm && (
        <GoalForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
      )}

      {editing && (
        <GoalForm
          initial={{
            name: editing.name,
            target_amount: editing.target_amount,
            target_date: editing.target_date || '',
            current_amount: editing.current_amount,
            priority: editing.priority,
          }}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(null)}
        />
      )}

      {goals.length === 0 && !showForm ? (
        <p className="text-sm text-slate-500 text-center py-8">No goals yet. Add your first one.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {goals.map((g) => {
            const pct = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0;
            return (
              <div key={g.id} className="bg-white rounded-lg border border-slate-200 p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">{g.name}</h3>
                    {g.target_date && (
                      <p className="text-xs text-slate-400">Target: {g.target_date}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setEditing(g);
                      }}
                      className="text-xs text-slate-400 hover:text-slate-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(g)}
                      className="text-xs text-slate-400 hover:text-rose-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <ProgressBar value={pct} />
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">{formatMoney(g.current_amount)}</span>
                  <span className="text-slate-400">of {formatMoney(g.target_amount)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
