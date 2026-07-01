import { useEffect, useState } from 'react';
import { useProfile } from '../context/ProfileContext.jsx';
import { api } from '../api.js';

export default function Settings() {
  const { activeUser, refreshUsers } = useProfile();
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', type: 'expense' });
  const [savingsRate, setSavingsRate] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const loadCategories = () => api.getCategories().then(setCategories);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (activeUser) setSavingsRate(String(activeUser.savings_rate_target));
  }, [activeUser]);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setError('');
    if (!newCategory.name) return;
    try {
      await api.addCategory(newCategory);
      setNewCategory({ name: '', type: 'expense' });
      loadCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    await api.deleteCategory(id);
    loadCategories();
  };

  const handleSavingsRateSubmit = async (e) => {
    e.preventDefault();
    await api.updateUser(activeUser.id, { savings_rate_target: Number(savingsRate) });
    await refreshUsers();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!activeUser) return null;

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Settings</h1>

      <div className="rounded-lg bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-700">Savings Rate Target ({activeUser.name})</h2>
        <form onSubmit={handleSavingsRateSubmit} className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            max="100"
            className="w-24 rounded border border-slate-300 px-3 py-2 text-sm"
            value={savingsRate}
            onChange={(e) => setSavingsRate(e.target.value)}
          />
          <span className="text-sm text-slate-500">%</span>
          <button className="rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">
            Save
          </button>
          {saved && <span className="text-xs text-emerald-600">Saved</span>}
        </form>
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-700">Categories</h2>
        <form onSubmit={handleAddCategory} className="mb-4 flex gap-2">
          <input
            type="text"
            placeholder="New category name"
            className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
            value={newCategory.name}
            onChange={(e) => setNewCategory((f) => ({ ...f, name: e.target.value }))}
          />
          <select
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            value={newCategory.type}
            onChange={(e) => setNewCategory((f) => ({ ...f, type: e.target.value }))}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <button className="rounded bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-900">
            Add
          </button>
        </form>
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
        <div className="space-y-1">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded px-2 py-1 text-sm hover:bg-slate-50">
              <span>
                {c.name} <span className="text-xs text-slate-400">({c.type})</span>
              </span>
              <button onClick={() => handleDeleteCategory(c.id)} className="text-xs text-rose-500 hover:text-rose-700">
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
