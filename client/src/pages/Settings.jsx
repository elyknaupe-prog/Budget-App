import { useEffect, useState, useCallback } from 'react';
import { useProfile } from '../lib/ProfileContext.jsx';
import { api } from '../lib/api.js';

function CategoryManager({ type, title, categories, onAdd, onDelete }) {
  const [name, setName] = useState('');
  const items = categories.filter((c) => c.type === type);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onAdd(type, name.trim());
    setName('');
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <h2 className="text-sm font-semibold text-slate-700 mb-3">{title}</h2>
      <div className="space-y-1 mb-3">
        {items.map((c) => (
          <div key={c.id} className="flex items-center justify-between text-sm py-1">
            <span className="text-slate-700">{c.name}</span>
            <button
              onClick={() => onDelete(c.id)}
              className="text-xs text-slate-400 hover:text-rose-600"
            >
              Remove
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-slate-400">No categories yet.</p>
        )}
      </div>
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          placeholder="New category"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 px-3 py-1.5 rounded-md border border-slate-300 text-sm"
        />
        <button
          type="submit"
          className="px-3 py-1.5 text-sm rounded-md bg-slate-800 hover:bg-slate-900 text-white font-medium"
        >
          Add
        </button>
      </form>
    </div>
  );
}

export default function Settings() {
  const { activeUser, refreshUsers } = useProfile();
  const [categories, setCategories] = useState([]);
  const [savingsRate, setSavingsRate] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const data = await api.getCategories();
    setCategories(data);
  }, []);

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [load]);

  useEffect(() => {
    if (activeUser) setSavingsRate(String(activeUser.savings_rate_target));
  }, [activeUser]);

  const handleSaveRate = async (e) => {
    e.preventDefault();
    const value = Number(savingsRate);
    if (Number.isNaN(value) || value < 0) return;
    await api.updateUser(activeUser.id, { savings_rate_target: value });
    await refreshUsers();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleAddCategory = async (type, name) => {
    await api.createCategory({ type, name });
    await load();
  };

  const handleDeleteCategory = async (id) => {
    await api.deleteCategory(id);
    await load();
  };

  if (!activeUser) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-500">Categories and your savings-rate target.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          {activeUser.name}&apos;s savings-rate target
        </h2>
        <form onSubmit={handleSaveRate} className="flex items-center gap-2">
          <input
            type="number"
            step="1"
            min="0"
            max="100"
            value={savingsRate}
            onChange={(e) => setSavingsRate(e.target.value)}
            className="w-24 px-3 py-2 rounded-md border border-slate-300 text-sm"
          />
          <span className="text-sm text-slate-500">% of income</span>
          <button
            type="submit"
            className="ml-2 px-4 py-2 text-sm rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          >
            Save
          </button>
          {saved && <span className="text-xs text-emerald-600">Saved</span>}
        </form>
        <p className="text-xs text-slate-400 mt-2">
          Used by the Opportunity Finder to flag how you're tracking against your goal.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <CategoryManager
          type="expense"
          title="Expense categories"
          categories={categories}
          onAdd={handleAddCategory}
          onDelete={handleDeleteCategory}
        />
        <CategoryManager
          type="income"
          title="Income categories"
          categories={categories}
          onAdd={handleAddCategory}
          onDelete={handleDeleteCategory}
        />
      </div>
    </div>
  );
}
