import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext.jsx';
import { api } from '../api.js';

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function TransactionForm() {
  const { activeUser } = useProfile();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    type: 'expense',
    category: '',
    amount: '',
    date: today(),
    recurring: false,
    note: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    if (!isEditing) return;
    api.getTransaction(id).then((t) =>
      setForm({
        type: t.type,
        category: t.category,
        amount: String(t.amount),
        date: t.date,
        recurring: Boolean(t.recurring),
        note: t.note ?? '',
      })
    );
  }, [id, isEditing]);

  const filteredCategories = categories.filter((c) => c.type === form.type);

  useEffect(() => {
    if (form.category && !filteredCategories.some((c) => c.name === form.category)) {
      setForm((f) => ({ ...f, category: '' }));
    }
  }, [form.type]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.category || !form.amount || !form.date) {
      setError('Category, amount, and date are required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        user_id: activeUser.id,
        type: form.type,
        category: form.category,
        amount: Number(form.amount),
        date: form.date,
        recurring: form.recurring,
        note: form.note || null,
      };

      if (isEditing) {
        await api.updateTransaction(id, payload);
      } else {
        await api.addTransaction(payload);
      }
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-xl font-bold text-slate-800">
        {isEditing ? 'Edit Transaction' : 'Add Transaction'}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg bg-white p-5 shadow-sm">
        <div className="flex gap-2">
          {['expense', 'income'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setForm((f) => ({ ...f, type }))}
              className={`flex-1 rounded border px-3 py-2 text-sm font-medium capitalize ${
                form.type === type
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                  : 'border-slate-300 text-slate-600'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
          <select
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          >
            <option value="">Select a category…</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Amount</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
          <input
            type="date"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.recurring}
            onChange={(e) => setForm((f) => ({ ...f, recurring: e.target.checked }))}
          />
          Recurring (e.g. rent, salary)
        </label>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Note (optional)</label>
          <input
            type="text"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Transaction'}
        </button>
      </form>
    </div>
  );
}
