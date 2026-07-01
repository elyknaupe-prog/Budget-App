import { Routes, Route } from 'react-router-dom';
import Nav from './components/Nav.jsx';
import { useProfile } from './context/ProfileContext.jsx';
import ProfileSelect from './pages/ProfileSelect.jsx';
import PersonalDashboard from './pages/PersonalDashboard.jsx';
import TransactionForm from './pages/TransactionForm.jsx';
import JointDashboard from './pages/JointDashboard.jsx';
import Goals from './pages/Goals.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  const { loading, activeUser } = useProfile();

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading…</div>;
  }

  if (!activeUser) {
    return <ProfileSelect />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Routes>
          <Route path="/" element={<PersonalDashboard />} />
          <Route path="/profile" element={<ProfileSelect />} />
          <Route path="/transactions/new" element={<TransactionForm />} />
          <Route path="/transactions/:id/edit" element={<TransactionForm />} />
          <Route path="/joint" element={<JointDashboard />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}
