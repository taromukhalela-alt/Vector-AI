import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [csrfToken, setCsrfToken] = useState('');

  const checkAuth = async () => {
    try {
      const response = await fetch('/auth/check');
      const data = await response.json();
      if (data.csrf_token) {
        setCsrfToken(data.csrf_token);
      }
      if (data.authenticated) {
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (e) {
      console.error('Failed to check auth', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.success) {
        await checkAuth();
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (e) {
      return { success: false, message: 'An error occurred during login' };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (data.success) {
        await checkAuth();
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Registration failed' };
      }
    } catch (e) {
      return { success: false, message: 'An error occurred during registration' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/auth/logout', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      });
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      checkAuth();
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, csrfToken, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
