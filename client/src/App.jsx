import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProfileSelect from './pages/ProfileSelect.jsx';
import PersonalDashboard from './pages/PersonalDashboard.jsx';
import JointDashboard from './pages/JointDashboard.jsx';
import Goals from './pages/Goals.jsx';
import { useProfile } from './lib/ProfileContext.jsx';

function RequireProfile({ children }) {
  const { activeUser, loading } = useProfile();
  if (loading) return null;
  if (!activeUser) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ProfileSelect />} />
      <Route
        element={
          <RequireProfile>
            <Layout />
          </RequireProfile>
        }
      >
        <Route path="/dashboard" element={<PersonalDashboard />} />
        <Route path="/joint" element={<JointDashboard />} />
        <Route path="/goals" element={<Goals />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
