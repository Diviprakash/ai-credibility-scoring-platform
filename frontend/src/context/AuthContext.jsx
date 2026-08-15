import React, { createContext, useState, useEffect, useCallback } from 'react';
import { loginApi, registerApi, getMeApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setError(null);
  }, []);

  // Fetch current user on mount or when token changes
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const userData = await getMeApi();
        if (isMounted) {
          setUser(userData);
          setToken(storedToken);
        }
      } catch (err) {
        console.error('Failed to initialize session from token:', err);
        if (isMounted) {
          logout();
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    // Global unauthorized event listener
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      isMounted = false;
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  const login = async (email, password) => {
    setError(null);
    try {
      const data = await loginApi(email, password);
      const accessToken = data.access_token;
      localStorage.setItem('token', accessToken);
      setToken(accessToken);

      // Fetch user profile immediately after login
      const userData = await getMeApi();
      setUser(userData);
      return userData;
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        (err.request ? 'Backend service unavailable. Please ensure the server is running.' : 'Login failed. Please check your credentials.');
      setError(message);
      throw new Error(message);
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const createdUser = await registerApi(userData);
      return createdUser;
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        (err.request ? 'Backend service unavailable. Please ensure the server is running.' : 'Registration failed. Please check your details.');
      setError(message);
      throw new Error(message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        isAuthenticated: !!user,
        role: user?.role,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
