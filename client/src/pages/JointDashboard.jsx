import { useEffect, useState, useCallback } from 'react';
import { useProfile } from '../lib/ProfileContext.jsx';
import { api } from '../lib/api.js';
import { currentMonth, formatMoney } from '../lib/categories.js';
import SummaryCard from '../components/SummaryCard.jsx';

export default function JointDashboard() {
  const { users } = useProfile();
  const [month] = useState(currentMonth());
  const [surpluses, setSurpluses] = useState([]);
  const [account, setAccount] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [balanceInput, setBalanceInput] = useState('');
  const [contribForm, setContribForm] = useState({ user_id: '', amount: '', date: new Date().toISOString().slice(0, 10), note: '' });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const [acct, contribs] = await Promise.all([api.getJointAccount(), api.getContributions()]);
    setAccount(acct);
    setBalanceInput(String(acct.balance));
    setContributions(contribs);

    const perUser = await Promise.all(
      users.map(async (u) => {
        const s = await api.getSummary(u.id, month);
        return { user: u, surplus: s.surplus };
      })
    );
    setSurpluses(perUser);
  }, [users, month]);

  useEffect(() => {
    if (users.length > 0) {
      load().catch((err) => setError(err.message));
    }
  }, [users, load]);

  useEffect(() => {
    if (users.length > 0 && !contribForm.user_id) {
      setContribForm((f) => ({ ...f, user_id: users[0].id }));
    }
  }, [users]); // eslint-disable-line react-hooks/exhaustive-deps

  const combinedSurplus = surpluses.reduce((sum, s) => sum + s.surplus, 0);

  const handleBalanceSave = async (e) => {
    e.preventDefault();
    const value = Number(balanceInput);
    if (Number.isNaN(value)) return;
    await api.updateJointAccount(value);
    await load();
  };

  const handleContribute = async (e) => {
    e.preventDefault();
    if (!contribForm.user_id || !contribForm.amount || Number(contribForm.amount) <= 0) return;
    await api.createContribution({
      user_id: Number(contribForm.user_id),
      amount: Number(contribForm.amount),
      date: contribForm.date,
      note: contribForm.note || null,
    });
    setContribForm((f) => ({ ...f, amount: '', note: '' }));
    await load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Joint Dashboard</h1>
        <p className="text-sm text-slate-500">Combined surplus and shared savings, {month}.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-3 gap-4">
        {surpluses.map(({ user, surplus }) => (
          <SummaryCard
            key={user.id}
            label={`${user.name}'s surplus`}
            amount={surplus}
            tone={surplus >= 0 ? 'positive' : 'negative'}
          />
        ))}
        <SummaryCard
          label="Combined investable"
          amount={combinedSurplus}
          tone={combinedSurplus >= 0 ? 'positive' : 'negative'}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Joint account balance</h2>
          <div className="text-2xl font-semibold text-slate-800 mb-3">
            {account ? formatMoney(account.balance) : '—'}
          </div>
          <form onSubmit={handleBalanceSave} className="flex gap-2">
            <input
              type="number"
              step="0.01"
              value={balanceInput}
              onChange={(e) => setBalanceInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-md border border-slate-300 text-sm"
            />
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-md bg-slate-800 hover:bg-slate-900 text-white font-medium"
            >
              Update balance
            </button>
          </form>
          <p className="text-xs text-slate-400 mt-2">
            Manual entry — update this whenever you check your joint account.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Log a contribution</h2>
          <form onSubmit={handleContribute} className="space-y-2">
            <select
              value={contribForm.user_id}
              onChange={(e) => setContribForm((f) => ({ ...f, user_id: e.target.value }))}
              className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Amount"
              value={contribForm.amount}
              onChange={(e) => setContribForm((f) => ({ ...f, amount: e.target.value }))}
              className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm"
            />
            <input
              type="date"
              value={contribForm.date}
              onChange={(e) => setContribForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm"
            />
            <input
              type="text"
              placeholder="Note (optional)"
              value={contribForm.note}
              onChange={(e) => setContribForm((f) => ({ ...f, note: e.target.value }))}
              className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm"
            />
            <button
              type="submit"
              className="w-full px-4 py-2 text-sm rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              Add contribution
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Contribution history</h2>
        {contributions.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No contributions logged yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {contributions.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <span className="font-medium text-slate-800">{c.user_name}</span>
                  <span className="text-slate-400 ml-2">{c.date}</span>
                  {c.note && <span className="text-slate-400 ml-2">· {c.note}</span>}
                </div>
                <span className="font-semibold text-emerald-600">{formatMoney(c.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
