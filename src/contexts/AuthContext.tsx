import React, { createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback } from 'react';
import { User, UserRole } from '@/types';
import { authApi } from '@/services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  verifyMFA: (code: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setRole: (role: UserRole) => void;
  pendingMFA: boolean;
  otpCode: string | null;
  showIdleWarning: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Idle timeout: 15 minutes (900000 milliseconds)
const IDLE_TIMEOUT = 15 * 60 * 1000;
// Warning timeout: 14 minutes (show warning 1 minute before logout)
const WARNING_TIMEOUT = 14 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Load user from localStorage on init
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [pendingMFA, setPendingMFA] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState<string | null>(null);
  
  // Idle timeout tracking
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const [showIdleWarning, setShowIdleWarning] = useState(false);

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
      
      // Check if password setup is required
      if (error.message?.includes('Password not set') || error.message?.includes('requires_password_setup')) {
        // Redirect to password setup page
        window.location.href = `/set-password?email=${encodeURIComponent(email)}`;
        return false;
      }
      
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
      lastActivityRef.current = Date.now(); // Reset activity time on login
      return true;
    } catch (error: any) {
      console.error('MFA verification error:', error);
    return false;
    }
  };

  const logout = useCallback(async () => {
    try {
      // Clear idle timers
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
      setShowIdleWarning(false);
      
      // Call logout API
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          await authApi.logout();
        } catch (error) {
          console.error('Logout API error:', error);
          // Continue with logout even if API call fails
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setUser(null);
      setPendingMFA(false);
      setTempToken(null);
      setOtpCode(null);
      lastActivityRef.current = Date.now();
      
      // Redirect to home page
      window.location.href = '/';
    }
  }, []);

  // Reset idle timer on user activity
  const resetIdleTimer = useCallback(() => {
    if (user) {
      lastActivityRef.current = Date.now();
      setShowIdleWarning(false);
      
      // Clear existing timers
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
      
      // Set warning timer (1 minute before logout)
      warningTimerRef.current = setTimeout(() => {
        setShowIdleWarning(true);
      }, WARNING_TIMEOUT);
      
      // Set logout timer
      idleTimerRef.current = setTimeout(() => {
        console.log('Session expired due to inactivity');
        setShowIdleWarning(false);
        logout();
      }, IDLE_TIMEOUT);
    }
  }, [user, logout]);

  // Track user activity
  useEffect(() => {
    if (!user) {
      // Clear timers if user is not logged in
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
      setShowIdleWarning(false);
      return;
    }

    // Set up activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    const handleActivity = () => {
      resetIdleTimer();
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initialize timer
    resetIdleTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
    };
  }, [user, resetIdleTimer]);

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
      otpCode,
      showIdleWarning
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
