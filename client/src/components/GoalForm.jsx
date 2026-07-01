import { useState } from 'react';

const emptyForm = {
  name: '',
  target_amount: '',
  target_date: '',
  current_amount: '0',
  priority: '0',
};

export default function GoalForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial || emptyForm);
  const [saving, setSaving] = useState(false);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.target_amount || Number(form.target_amount) <= 0) return;
    setSaving(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        target_amount: Number(form.target_amount),
        target_date: form.target_date || null,
        current_amount: Number(form.current_amount || 0),
        priority: Number(form.priority || 0),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 bg-white p-4 rounded-lg border border-slate-200">
      <input
        type="text"
        placeholder="Goal name (e.g. Emergency fund)"
        value={form.name}
        onChange={(e) => update('name', e.target.value)}
        className="col-span-2 px-3 py-2 rounded-md border border-slate-300 text-sm"
        required
      />
      <input
        type="number"
        step="0.01"
        min="0"
        placeholder="Target amount"
        value={form.target_amount}
        onChange={(e) => update('target_amount', e.target.value)}
        className="px-3 py-2 rounded-md border border-slate-300 text-sm"
        required
      />
      <input
        type="date"
        placeholder="Target date"
        value={form.target_date || ''}
        onChange={(e) => update('target_date', e.target.value)}
        className="px-3 py-2 rounded-md border border-slate-300 text-sm"
      />
      <input
        type="number"
        step="0.01"
        min="0"
        placeholder="Current progress"
        value={form.current_amount}
        onChange={(e) => update('current_amount', e.target.value)}
        className="px-3 py-2 rounded-md border border-slate-300 text-sm"
      />
      <input
        type="number"
        step="1"
        placeholder="Priority (lower = higher priority)"
        value={form.priority}
        onChange={(e) => update('priority', e.target.value)}
        className="px-3 py-2 rounded-md border border-slate-300 text-sm"
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
