import { useEffect, useMemo, useState } from 'react';
import { useProfile } from '../context/ProfileContext.jsx';
import { api } from '../api.js';

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default function JointDashboard() {
  const { users } = useProfile();
  const [month] = useState(currentMonth());
  const [surplusByUser, setSurplusByUser] = useState({});
  const [jointAccount, setJointAccount] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [balanceInput, setBalanceInput] = useState('');
  const [contributionForm, setContributionForm] = useState({ user_id: '', amount: '', date: '', note: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [account, contribs] = await Promise.all([api.getJointAccount(), api.getContributions()]);
      setJointAccount(account);
      setBalanceInput(String(account.balance));
      setContributions(contribs);

      const surpluses = {};
      for (const user of users) {
        const txns = await api.getTransactions({ user_id: user.id, month });
        const income = txns.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expenses = txns.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        surpluses[user.id] = income - expenses;
      }
      setSurplusByUser(surpluses);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (users.length === 0) return;
    loadAll();
    setContributionForm((f) => ({ ...f, user_id: users[0].id, date: new Date().toISOString().slice(0, 10) }));
  }, [users, month]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalSurplus = useMemo(
    () => Object.values(surplusByUser).reduce((sum, v) => sum + v, 0),
    [surplusByUser]
  );

  const handleBalanceUpdate = async (e) => {
    e.preventDefault();
    const account = await api.updateJointAccount({ balance: Number(balanceInput) });
    setJointAccount(account);
  };

  const handleContributionSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!contributionForm.user_id || !contributionForm.amount || !contributionForm.date) {
      setError('User, amount, and date are required.');
      return;
    }
    try {
      await api.addContribution({
        user_id: Number(contributionForm.user_id),
        amount: Number(contributionForm.amount),
        date: contributionForm.date,
        note: contributionForm.note || null,
      });
      setContributionForm((f) => ({ ...f, amount: '', note: '' }));
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteContribution = async (id) => {
    await api.deleteContribution(id);
    loadAll();
  };

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Joint Dashboard</h1>
      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {users.map((user) => (
          <div key={user.id} className="rounded-lg bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">{user.name}'s surplus ({month})</p>
            <p className={`text-2xl font-semibold ${surplusByUser[user.id] >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              ${(surplusByUser[user.id] ?? 0).toFixed(2)}
            </p>
          </div>
        ))}
        <div className="rounded-lg bg-emerald-600 p-4 text-white shadow-sm">
          <p className="text-sm text-emerald-100">Total investable this month</p>
          <p className="text-2xl font-semibold">${totalSurplus.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold text-slate-700">Joint Account Balance</h2>
          <p className="mb-3 text-3xl font-bold text-slate-800">
            ${jointAccount?.balance.toFixed(2)}
          </p>
          <p className="mb-3 text-xs text-slate-400">
            Last updated {jointAccount?.last_updated ? new Date(jointAccount.last_updated).toLocaleString() : '—'}
          </p>
          <form onSubmit={handleBalanceUpdate} className="flex gap-2">
            <input
              type="number"
              step="0.01"
              className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
              value={balanceInput}
              onChange={(e) => setBalanceInput(e.target.value)}
            />
            <button className="rounded bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-900">
              Update Balance
            </button>
          </form>
          <p className="mt-2 text-xs text-slate-400">
            Use this to manually sync the balance from your bank/brokerage statement.
          </p>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold text-slate-700">Log a Contribution</h2>
          <form onSubmit={handleContributionSubmit} className="space-y-3">
            <select
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={contributionForm.user_id}
              onChange={(e) => setContributionForm((f) => ({ ...f, user_id: e.target.value }))}
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
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={contributionForm.amount}
              onChange={(e) => setContributionForm((f) => ({ ...f, amount: e.target.value }))}
            />
            <input
              type="date"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={contributionForm.date}
              onChange={(e) => setContributionForm((f) => ({ ...f, date: e.target.value }))}
            />
            <input
              type="text"
              placeholder="Note (optional)"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={contributionForm.note}
              onChange={(e) => setContributionForm((f) => ({ ...f, note: e.target.value }))}
            />
            <button className="w-full rounded bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700">
              Add Contribution
            </button>
          </form>
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-700">Contribution History</h2>
        {contributions.length === 0 ? (
          <p className="text-sm text-slate-500">No contributions logged yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2">Date</th>
                <th>Contributor</th>
                <th>Note</th>
                <th className="text-right">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {contributions.map((c) => (
                <tr key={c.id} className="border-b border-slate-100">
                  <td className="py-2">{c.date}</td>
                  <td>{c.user_name}</td>
                  <td className="text-slate-500">{c.note}</td>
                  <td className="text-right font-medium text-emerald-600">${c.amount.toFixed(2)}</td>
                  <td className="text-right">
                    <button
                      onClick={() => handleDeleteContribution(c.id)}
                      className="text-xs text-rose-500 hover:text-rose-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
