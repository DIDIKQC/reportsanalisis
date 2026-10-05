import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
  status?: string;
  expiresAt?: string;
  accessIa?: number;
  accessAl?: number;
  onlyAl?: number;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  viewAs: string | null;
  tenantList: UserProfile[];
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setViewAs: (userId: string | null) => void;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('lab_auth_token'));
  const [viewAs, setViewAsState] = useState<string | null>(() => localStorage.getItem('lab_view_as'));
  const [tenantList, setTenantList] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Load current user profile if token exists
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('lab_auth_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (res.data.user) {
          setUser(res.data.user);
          if (res.data.user.role === 'superadmin' || res.data.user.role === 'SUPER_ADMIN') {
            loadTenants();
          }
        }
      } catch (err) {
        console.error('Session expired or invalid token:', err);
        localStorage.removeItem('lab_auth_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [token]);

  const loadTenants = async () => {
    try {
      const res = await api.get('/master/users');
      if (res.data.users) {
        const mapped = res.data.users.map((u: any) => ({
          id: u.id,
          username: u.username,
          fullName: u.full_name,
          email: u.email,
          role: u.role_name,
          status: u.status,
          expiresAt: u.expires_at,
          accessIa: u.access_ia,
          accessAl: u.access_al,
          onlyAl: u.only_al
        }));
        setTenantList(mapped);
      }
    } catch (err) {
      console.error('Failed to load tenants list for View As:', err);
    }
  };

  const login = async (username: string, password: string) => {
    const res = await api.post('/auth/login', { username, password });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('lab_auth_token', newToken);
    setToken(newToken);
    setUser(newUser);
    if (newUser.role === 'superadmin' || newUser.role === 'SUPER_ADMIN') {
      loadTenants();
    }
  };

  const register = async (username: string, fullName: string, email: string, password: string) => {
    const res = await api.post('/auth/register', { username, fullName, email, password });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('lab_auth_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('lab_auth_token');
    localStorage.removeItem('lab_view_as');
    setToken(null);
    setUser(null);
    setViewAsState(null);
  };

  const setViewAs = (userId: string | null) => {
    if (!userId || userId === 'ALL' || userId === '') {
      localStorage.removeItem('lab_view_as');
      setViewAsState(null);
    } else {
      localStorage.setItem('lab_view_as', userId);
      setViewAsState(userId);
    }
    // Reload data or trigger re-render
    window.location.reload();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        viewAs,
        tenantList,
        login,
        register,
        logout,
        setViewAs,
        refreshUsers: loadTenants
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
