import { formatMoney } from '../lib/categories.js';

export default function SummaryCard({ label, amount, tone = 'default' }) {
  const toneClass =
    tone === 'positive'
      ? 'text-emerald-600'
      : tone === 'negative'
      ? 'text-rose-600'
      : 'text-slate-800';

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
        {label}
      </div>
      <div className={`text-2xl font-semibold mt-1 ${toneClass}`}>
        {formatMoney(amount)}
      </div>
    </div>
  );
}
