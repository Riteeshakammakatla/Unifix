import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

export const AuthContext = createContext(null);

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Validate stored token on mount — clear if expired
    const saved = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
    if (saved && token) {
      const claims = parseJwt(token);
      if (claims && claims.exp * 1000 > Date.now()) {
        return JSON.parse(saved);
      }
      // Token expired — clean up stale data
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
    return null;
  });
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password, selectedRole) => {
    setLoading(true);
    try {
      const res = await authAPI.login(email, password, selectedRole);
      
      // If OTP is required, don't store tokens yet, just return the requirement
      if (res.data.otp_required) {
        return { otp_required: true, email: res.data.email };
      }

      const { access, refresh } = res.data;
      return finalizeLogin(access, refresh);
    } catch (error) {
      throw error.response?.data || { detail: 'Login failed' };
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOTP = useCallback(async (email, otp) => {
    setLoading(true);
    try {
      const res = await authAPI.verifyOTP(email, otp);
      const { access, refresh } = res.data;
      return finalizeLogin(access, refresh);
    } catch (error) {
      throw error.response?.data || { detail: 'Verification failed' };
    } finally {
      setLoading(false);
    }
  }, []);

  const finalizeLogin = (access, refresh) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);

    const claims = parseJwt(access);
    const userData = {
      id: claims.user_id,
      email: claims.email,
      name: claims.name,
      role: claims.role,
    };

    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    login,
    verifyOTP,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
