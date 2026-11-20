import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('dineflow_token');
    const savedUser = localStorage.getItem('dineflow_user');

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        // Verify with backend
        api.getMe()
          .then((res) => {
            setUser(res.user);
            localStorage.setItem('dineflow_user', JSON.stringify(res.user));
          })
          .catch(() => {
            // Token expired or invalid
            logout();
          })
          .finally(() => setLoading(false));
      } catch (e) {
        logout();
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    try {
      const res = await api.login({ username, password });
      localStorage.setItem('dineflow_token', res.token);
      localStorage.setItem('dineflow_user', JSON.stringify(res.user));
      setUser(res.user);
      showToast(`Welcome back, ${res.user.full_name}! (${res.user.role.toUpperCase()})`, 'success');
      return res.user;
    } catch (err) {
      showToast(err.message || 'Login failed', 'error');
      throw err;
    }
  };

  const quickSwitchRole = async (username) => {
    try {
      const res = await api.login({ username, password: 'password123' });
      localStorage.setItem('dineflow_token', res.token);
      localStorage.setItem('dineflow_user', JSON.stringify(res.user));
      setUser(res.user);
      showToast(`Switched role to ${res.user.full_name} (${res.user.role.toUpperCase()})`, 'success');
      return res.user;
    } catch (err) {
      showToast(err.message || 'Role switch failed', 'error');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('dineflow_token');
    localStorage.removeItem('dineflow_user');
    setUser(null);
    showToast('Signed out of DineFlow', 'info');
  };

  const hasRole = (...allowedRoles) => {
    if (!user) return false;
    if (user.role === 'owner') return true; // Owner has all permissions
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, quickSwitchRole, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
