import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../lib/ProfileContext.jsx';
import { api } from '../lib/api.js';

export default function ProfileSelect() {
  const { users, selectUser, refreshUsers, loading } = useProfile();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const pick = (id) => {
    selectUser(id);
    navigate('/dashboard');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim()) return;
    setCreating(true);
    try {
      const user = await api.createUser({ name: name.trim(), email: email.trim() });
      await refreshUsers();
      setName('');
      setEmail('');
      pick(user.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h1 className="text-xl font-semibold text-slate-800 mb-1">Couples Budget</h1>
        <p className="text-sm text-slate-500 mb-6">Who&apos;s this?</p>

        {users.length > 0 && (
          <div className="space-y-2 mb-6">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => pick(u.id)}
                className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition"
              >
                <div className="font-medium text-slate-800">{u.name}</div>
                <div className="text-xs text-slate-500">{u.email}</div>
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-3 border-t border-slate-100 pt-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Add a profile
          </p>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={creating}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-md"
          >
            {creating ? 'Creating…' : 'Create profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
