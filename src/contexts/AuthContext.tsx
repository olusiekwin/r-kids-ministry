import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  verifyMFA: (code: string) => Promise<boolean>;
  logout: () => void;
  setRole: (role: UserRole) => void;
  pendingMFA: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const mockUsers: Record<string, User> = {
  'admin@rkids.church': { id: '1', email: 'admin@rkids.church', role: 'admin', name: 'Admin User' },
  'teacher@rkids.church': { id: '2', email: 'teacher@rkids.church', role: 'teacher', name: 'Sarah Teacher' },
  'parent@rkids.church': { id: '3', email: 'parent@rkids.church', role: 'parent', name: 'John Parent' },
  'teen@rkids.church': { id: '4', email: 'teen@rkids.church', role: 'teen', name: 'Mike Teen' },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [pendingMFA, setPendingMFA] = useState(false);
  const [tempUser, setTempUser] = useState<User | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const foundUser = mockUsers[email.toLowerCase()];
    if (foundUser && password === 'password123') {
      setTempUser(foundUser);
      setPendingMFA(true);
      return true;
    }
    return false;
  };

  const verifyMFA = async (code: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (code === '123456' && tempUser) {
      setUser(tempUser);
      setPendingMFA(false);
      setTempUser(null);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setPendingMFA(false);
    setTempUser(null);
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
      pendingMFA
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
