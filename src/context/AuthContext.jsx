// 인증 Context: 로그인 유저 상태·localStorage 복원·setUser/clearUser 제공.

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [isRestored, setIsRestored] = useState(false);

  const setUser = useCallback((userData) => {
    setUserState(userData);
    if (userData) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      } catch (_) {}
    } else {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (_) {}
    }
  }, []);

  const clearUser = useCallback(() => {
    setUserState(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        setUserState(data);
      }
    } catch (_) {
      setUserState(null);
    }
    setIsRestored(true);
  }, []);

  const value = {
    user,
    isLoggedIn: !!user,
    isRestored,
    setUser,
    clearUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
