import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { authApi } from '@/services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  verifyMFA: (code: string) => Promise<boolean>;
  logout: () => void;
  setRole: (role: UserRole) => void;
  pendingMFA: boolean;
  otpCode: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Load user from localStorage on init
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [pendingMFA, setPendingMFA] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState<string | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authApi.login(email, password);
    
      if (response.requiresMFA) {
        setTempToken(response.token);
        setOtpCode(response.otpCode || null); // Store OTP code from backend
        setPendingMFA(true);
        return true;
      } else {
        // No MFA required
        localStorage.setItem('auth_token', response.token);
        // Fetch user profile
        // const userProfile = await fetchUserProfile(response.token);
        // setUser(userProfile);
        return true;
      }
    } catch (error: any) {
      console.error('Login error:', error);
    return false;
    }
  };

  const verifyMFA = async (code: string): Promise<boolean> => {
    try {
      const response = await authApi.verifyMFA(code, tempToken || undefined);
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
      setPendingMFA(false);
      setTempToken(null);
      setOtpCode(null); // Clear OTP code after successful verification
      return true;
    } catch (error: any) {
      console.error('MFA verification error:', error);
    return false;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    setUser(null);
    setPendingMFA(false);
      setTempToken(null);
      setOtpCode(null);
    }
  };

  const setRole = (role: UserRole) => {
    if (user) {
      setUser({ ...user, role });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      verifyMFA,
      logout,
      setRole,
      pendingMFA,
      otpCode
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
