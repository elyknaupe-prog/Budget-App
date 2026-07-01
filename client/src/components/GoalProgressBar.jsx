export default function GoalProgressBar({ current, target }) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  return (
    <div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-xs text-slate-500">
        <span>${current.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        <span>{pct}%</span>
        <span>${target.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
      </div>
    </div>
  );
}
