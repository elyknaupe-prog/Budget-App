import { NavLink, Outlet } from 'react-router-dom';
import { useProfile } from '../lib/ProfileContext.jsx';

const navItemClass = ({ isActive }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${
    isActive ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
  }`;

export default function Layout() {
  const { activeUser, selectUser } = useProfile();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-slate-800">Couples Budget</span>
            <nav className="flex gap-1">
              <NavLink to="/dashboard" className={navItemClass}>
                My Dashboard
              </NavLink>
              <NavLink to="/joint" className={navItemClass}>
                Joint
              </NavLink>
              <NavLink to="/goals" className={navItemClass}>
                Goals
              </NavLink>
              <NavLink to="/opportunity" className={navItemClass}>
                Opportunity
              </NavLink>
              <NavLink to="/settings" className={navItemClass}>
                Settings
              </NavLink>
            </nav>
          </div>
          <button
            onClick={() => selectUser(null)}
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            {activeUser?.name} (switch)
          </button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
