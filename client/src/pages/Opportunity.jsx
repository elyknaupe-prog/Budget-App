import { useEffect, useState, useCallback } from 'react';
import { useProfile } from '../lib/ProfileContext.jsx';
import { api } from '../lib/api.js';
import { currentMonth, formatMoney } from '../lib/categories.js';
import SummaryCard from '../components/SummaryCard.jsx';

function suggestAllocation(amount, goals) {
  let remaining = Math.max(0, amount);
  const sorted = [...goals].sort((a, b) => a.priority - b.priority);
  return sorted
    .map((g) => {
      const need = Math.max(0, g.target_amount - g.current_amount);
      const allocation = Math.min(need, remaining);
      remaining -= allocation;
      return { goal: g, allocation };
    })
    .filter((a) => a.allocation > 0);
}

export default function Opportunity() {
  const { users } = useProfile();
  const [month] = useState(currentMonth());
  const [perUser, setPerUser] = useState([]);
  const [goals, setGoals] = useState([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const [goalData, summaries] = await Promise.all([
      api.getGoals(),
      Promise.all(
        users.map(async (u) => {
          const s = await api.getSummary(u.id, month);
          const target = (s.income * u.savings_rate_target) / 100;
          return { user: u, ...s, target, opportunity: s.surplus - target };
        })
      ),
    ]);
    setGoals(goalData);
    setPerUser(summaries);
  }, [users, month]);

  useEffect(() => {
    if (users.length > 0) {
      load().catch((err) => setError(err.message));
    }
  }, [users, load]);

  const combinedSurplus = perUser.reduce((sum, p) => sum + p.surplus, 0);
  const combinedTarget = perUser.reduce((sum, p) => sum + p.target, 0);
  const combinedOpportunity = combinedSurplus - combinedTarget;
  const allocations = suggestAllocation(Math.max(0, combinedSurplus), goals);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Opportunity Finder</h1>
        <p className="text-sm text-slate-500">
          How each of you is tracking against your savings-rate target, {month}.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-2 gap-4">
        {perUser.map((p) => (
          <div key={p.user.id} className="bg-white rounded-lg border border-slate-200 p-4 space-y-2">
            <h2 className="text-sm font-semibold text-slate-700">
              {p.user.name} · target {p.user.savings_rate_target}%
            </h2>
            <div className="text-sm text-slate-500">
              Surplus {formatMoney(p.surplus)} vs. target {formatMoney(p.target)}
            </div>
            {p.opportunity >= 0 ? (
              <p className="text-sm font-medium text-emerald-600">
                On track — ${p.opportunity.toFixed(0)} available to invest beyond target
              </p>
            ) : (
              <p className="text-sm font-medium text-rose-600">
                ${Math.abs(p.opportunity).toFixed(0)} short of target this month
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <SummaryCard label="Combined surplus" amount={combinedSurplus} tone={combinedSurplus >= 0 ? 'positive' : 'negative'} />
        <SummaryCard label="Combined target" amount={combinedTarget} />
        <SummaryCard
          label="Combined opportunity"
          amount={combinedOpportunity}
          tone={combinedOpportunity >= 0 ? 'positive' : 'negative'}
        />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Suggested split across goals (by priority)
        </h2>
        {combinedSurplus <= 0 ? (
          <p className="text-sm text-slate-500">No surplus available to allocate this month.</p>
        ) : allocations.length === 0 ? (
          <p className="text-sm text-slate-500">
            No active goals to allocate to — add one on the Goals page.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {allocations.map(({ goal, allocation }) => (
              <div key={goal.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-700">{goal.name}</span>
                <span className="font-semibold text-emerald-600">{formatMoney(allocation)}</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-slate-400 mt-3">
          This is a suggestion only — log actual contributions from the Joint dashboard.
        </p>
      </div>
    </div>
  );
}
