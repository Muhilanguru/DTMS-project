import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';

const AuthContext = createContext(null);

/**
 * Get the current authenticated user from localStorage
 * Supports multiple users on different devices/browsers
 */
const getStoredUser = () => {
  const stored = localStorage.getItem('user') || localStorage.getItem('dtms_user');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('dtms_user');
    }
  }
  return null;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize user from localStorage on mount
  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
    }
    setLoading(false);
  }, []);

  // Listen for storage changes across tabs (for multi-tab support)
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'user' || event.key === 'dtms_user') {
        const stored = getStoredUser();
        if (stored) {
          setUser(stored);
        } else {
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    // Store in 'user' key (primary key for consistency)
    localStorage.setItem('user', JSON.stringify(data));
    // Remove legacy key if it exists
    localStorage.removeItem('dtms_user');
    setUser(data);
    return data;
  };

  const register = async (name, email, password, role) => {
    const { data } = await API.post('/auth/register', { name, email, password, role });
    // Store in 'user' key (primary key for consistency)
    localStorage.setItem('user', JSON.stringify(data));
    // Remove legacy key if it exists
    localStorage.removeItem('dtms_user');
    setUser(data);
    return data;
  };

  const logout = () => {
    // Only remove current user's session
    localStorage.removeItem('user');
    localStorage.removeItem('dtms_user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    // Helper: check if user is authenticated
    isAuthenticated: Boolean(user && user.token),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
