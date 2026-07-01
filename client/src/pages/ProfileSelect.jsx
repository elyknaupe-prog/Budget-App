import { useNavigate } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext.jsx';

export default function ProfileSelect() {
  const { users, setActiveUserId, loading } = useProfile();
  const navigate = useNavigate();

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading…</div>;
  }

  const choose = (id) => {
    setActiveUserId(id);
    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-slate-50 px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-800">Couples Budget</h1>
        <p className="mt-1 text-slate-500">Who's checking in?</p>
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => choose(user.id)}
            className="w-40 rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:border-emerald-400 hover:shadow-md"
          >
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-xl font-semibold text-emerald-700">
              {user.name.charAt(0)}
            </div>
            <div className="font-medium text-slate-800">{user.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
