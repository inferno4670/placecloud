import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { User, Role } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isStudent: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isCoordinator: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('placecloud_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('placecloud_token'));
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data) {
        setUser(res.data);
        localStorage.setItem('placecloud_user', JSON.stringify(res.data));
      }
    } catch (err: any) {
      console.warn('Failed to fetch user profile:', err);
      // Only clear if 401 unauthenticated
      if (err.response && err.response.status === 401) {
        setUser(null);
        setToken(null);
        localStorage.removeItem('placecloud_token');
        localStorage.removeItem('placecloud_user');
      }
    }
  };

  useEffect(() => {
    if (token && !user) {
      setIsLoading(true);
      fetchCurrentUser().finally(() => setIsLoading(false));
    }
  }, [token]);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { access_token, user_id, role, full_name, email: userEmail } = res.data;

      const basicUser: User = {
        id: user_id,
        email: userEmail || email,
        full_name: full_name || '',
        role: role,
        is_active: true,
      };

      localStorage.setItem('placecloud_token', access_token);
      localStorage.setItem('placecloud_user', JSON.stringify(basicUser));
      setToken(access_token);
      setUser(basicUser);

      // Refresh full profile in background
      api.get('/auth/me', {
        headers: { Authorization: `Bearer ${access_token}` }
      }).then(meRes => {
        if (meRes.data) {
          setUser(meRes.data);
          localStorage.setItem('placecloud_user', JSON.stringify(meRes.data));
        }
      }).catch(e => console.warn('Background profile fetch notice:', e));

      return basicUser;
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
