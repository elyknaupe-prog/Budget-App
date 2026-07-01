import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from './api.js';

const ProfileContext = createContext(null);

const STORAGE_KEY = 'budget-app.activeUserId';

export function ProfileProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [activeUserId, setActiveUserId] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? Number(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  const refreshUsers = useCallback(async () => {
    const data = await api.getUsers();
    setUsers(data);
    return data;
  }, []);

  useEffect(() => {
    refreshUsers().finally(() => setLoading(false));
  }, [refreshUsers]);

  const selectUser = (id) => {
    setActiveUserId(id);
    if (id == null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, String(id));
    }
  };

  const activeUser = users.find((u) => u.id === activeUserId) || null;

  return (
    <ProfileContext.Provider
      value={{ users, activeUser, activeUserId, selectUser, refreshUsers, loading }}
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
