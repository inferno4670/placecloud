import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { User, Role } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isStudent: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isCoordinator: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('placecloud_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
      localStorage.setItem('placecloud_user', JSON.stringify(res.data));
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      setUser(null);
      setToken(null);
      localStorage.removeItem('placecloud_token');
      localStorage.removeItem('placecloud_user');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { access_token } = res.data;
      localStorage.setItem('placecloud_token', access_token);
      setToken(access_token);
      await fetchCurrentUser();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('placecloud_token');
    localStorage.removeItem('placecloud_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const role = user?.role;
  const isStudent = role === 'STUDENT';
  const isAdmin = role === 'SUPER_ADMIN' || role === 'TPO_ADMIN';
  const isCoordinator = role === 'PLACEMENT_COORDINATOR';
  const isStaff = isAdmin || isCoordinator;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        refreshUser,
        isStudent,
        isAdmin,
        isStaff,
        isCoordinator,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
