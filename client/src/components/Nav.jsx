import { NavLink, Link } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext.jsx';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/transactions/new', label: 'Add Transaction' },
  { to: '/joint', label: 'Joint' },
  { to: '/goals', label: 'Goals' },
  { to: '/settings', label: 'Settings' },
];

export default function Nav() {
  const { users, activeUser, setActiveUserId } = useProfile();

  return (
    <nav className="bg-slate-900 text-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-lg font-semibold">Couples Budget</span>
          <div className="hidden gap-4 sm:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `text-sm ${isActive ? 'font-semibold text-white' : 'text-slate-300 hover:text-white'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
        {users.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              className="rounded bg-slate-800 px-2 py-1 text-sm"
              value={activeUser?.id ?? ''}
              onChange={(e) => setActiveUserId(Number(e.target.value))}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            <Link to="/profile" className="text-xs text-slate-400 hover:text-white">
              Switch
            </Link>
          </div>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto border-t border-slate-800 px-4 py-2 sm:hidden">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `whitespace-nowrap text-sm ${isActive ? 'font-semibold text-white' : 'text-slate-300'}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
