import { formatMoney } from '../lib/categories.js';

export default function TransactionList({ transactions, onEdit, onDelete }) {
  if (transactions.length === 0) {
    return <p className="text-sm text-slate-500 py-6 text-center">No transactions this month yet.</p>;
  }

  return (
    <div className="divide-y divide-slate-100">
      {transactions.map((t) => (
        <div key={t.id} className="flex items-center justify-between py-3">
          <div>
            <div className="text-sm font-medium text-slate-800">
              {t.category}
              {!!t.recurring && (
                <span className="ml-2 text-xs text-slate-400 font-normal">recurring</span>
              )}
            </div>
            <div className="text-xs text-slate-500">
              {t.date}
              {t.note ? ` · ${t.note}` : ''}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`text-sm font-semibold ${
                t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {t.type === 'income' ? '+' : '-'}
              {formatMoney(t.amount)}
            </span>
            <button
              onClick={() => onEdit(t)}
              className="text-xs text-slate-400 hover:text-slate-700"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(t)}
              className="text-xs text-slate-400 hover:text-rose-600"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
