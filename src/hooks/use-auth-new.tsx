// src/hooks/use-auth.tsx
'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { authClient } from '@/lib/auth-client';
import { UserProfile } from '@/lib/types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  signup: (email: string, password: string, name: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing user on mount
  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await authClient.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error checking current user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<UserProfile> => {
    setLoading(true);
    try {
      const result = await authClient.login(email, password);
      
      if (result.success && result.user) {
        setUser(result.user);
        return result.user;
      } else {
        throw new Error(result.error || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string): Promise<UserProfile> => {
    setLoading(true);
    try {
      const result = await authClient.signup(email, password, name);
      
      if (result.success && result.user) {
        setUser(result.user);
        return result.user;
      } else {
        throw new Error(result.error || 'Signup failed');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      await authClient.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user) throw new Error('No user logged in');
    
    try {
      await authClient.updateUser(user.uid, updates);
      setUser(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }, [user]);

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
