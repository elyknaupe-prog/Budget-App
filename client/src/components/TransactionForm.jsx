import { useState } from 'react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../lib/categories.js';

const emptyForm = {
  type: 'expense',
  category: EXPENSE_CATEGORIES[0],
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  recurring: false,
  note: '',
};

export default function TransactionForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial || emptyForm);
  const [saving, setSaving] = useState(false);
  const categories = form.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const update = (field, value) =>
    setForm((f) => ({
      ...f,
      [field]: value,
      ...(field === 'type'
        ? { category: value === 'expense' ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0] }
        : {}),
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) return;
    setSaving(true);
    try {
      await onSubmit({ ...form, amount: Number(form.amount) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 bg-white p-4 rounded-lg border border-slate-200">
      <div className="col-span-2 flex gap-2">
        {['expense', 'income'].map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => update('type', t)}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium capitalize ${
              form.type === t
                ? t === 'expense'
                  ? 'bg-rose-100 text-rose-700 border border-rose-300'
                  : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                : 'bg-slate-100 text-slate-500 border border-transparent'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <select
        value={form.category}
        onChange={(e) => update('category', e.target.value)}
        className="col-span-1 px-3 py-2 rounded-md border border-slate-300 text-sm"
      >
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <input
        type="number"
        step="0.01"
        min="0"
        placeholder="Amount"
        value={form.amount}
        onChange={(e) => update('amount', e.target.value)}
        className="col-span-1 px-3 py-2 rounded-md border border-slate-300 text-sm"
        required
      />

      <input
        type="date"
        value={form.date}
        onChange={(e) => update('date', e.target.value)}
        className="col-span-1 px-3 py-2 rounded-md border border-slate-300 text-sm"
        required
      />

      <label className="col-span-1 flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={form.recurring}
          onChange={(e) => update('recurring', e.target.checked)}
        />
        Recurring monthly
      </label>

      <input
        type="text"
        placeholder="Note (optional)"
        value={form.note || ''}
        onChange={(e) => update('note', e.target.value)}
        className="col-span-2 px-3 py-2 rounded-md border border-slate-300 text-sm"
      />

      <div className="col-span-2 flex gap-2 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-md text-slate-500 hover:bg-slate-100"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}
