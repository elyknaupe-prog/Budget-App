import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [activeUserId, setActiveUserId] = useState(() => {
    const stored = localStorage.getItem('activeUserId');
    return stored ? Number(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  const refreshUsers = useCallback(async () => {
    const data = await api.getUsers();
    setUsers(data);
    return data;
  }, []);

  useEffect(() => {
    refreshUsers()
      .then((data) => {
        setActiveUserId((current) => {
          if (current && data.some((u) => u.id === current)) return current;
          return data[0]?.id ?? null;
        });
      })
      .finally(() => setLoading(false));
  }, [refreshUsers]);

  useEffect(() => {
    if (activeUserId != null) localStorage.setItem('activeUserId', String(activeUserId));
  }, [activeUserId]);

  const activeUser = users.find((u) => u.id === activeUserId) ?? null;
  const partner = users.find((u) => u.id !== activeUserId) ?? null;

  return (
    <ProfileContext.Provider
      value={{ users, activeUser, partner, activeUserId, setActiveUserId, loading, refreshUsers }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
