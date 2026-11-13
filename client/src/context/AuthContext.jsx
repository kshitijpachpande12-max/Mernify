import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API = 'http://localhost:5000';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('sentinel_token') || localStorage.getItem('mernitor_token') || localStorage.getItem('mernify_token'));
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('sentinel_user') || localStorage.getItem('mernitor_user') || localStorage.getItem('mernify_user');
    return u ? JSON.parse(u) : null;
  });

  const saveAuth = useCallback((data) => {
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('sentinel_token', data.token);
    localStorage.setItem('sentinel_user', JSON.stringify(data.user));
    localStorage.setItem('mernitor_token', data.token);
    localStorage.setItem('mernitor_user', JSON.stringify(data.user));
    localStorage.setItem('mernify_token', data.token);
    localStorage.setItem('mernify_user', JSON.stringify(data.user));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Login failed');
    }
    const data = await res.json();
    saveAuth(data);
    return data;
  }, [saveAuth]);

  const register = useCallback(async (name, email, password) => {
    const res = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Registration failed');
    }
    const data = await res.json();
    saveAuth(data);
    return data;
  }, [saveAuth]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('sentinel_token');
    localStorage.removeItem('sentinel_user');
    localStorage.removeItem('mernitor_token');
    localStorage.removeItem('mernitor_user');
    localStorage.removeItem('mernify_token');
    localStorage.removeItem('mernify_user');
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
