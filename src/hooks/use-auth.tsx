
// src/hooks/use-auth.tsx
'use client';

import {
  createContext,
  useContext,
  ReactNode,
  useCallback,
} from 'react';
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';
import { UserProfile } from '@/lib/types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  signup: (email: string, password: string, name: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
  refreshUser: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Usar o hook do NextAuth para gerenciar a sessão
  const { data: session, status, update } = useSession();
  
  const loading = status === 'loading';
  
  // Converter sessão do NextAuth para UserProfile
  const user: UserProfile | null = session?.user ? {
    uid: session.user.id,
    email: session.user.email!,
    displayName: session.user.name || '',
    plan: (session.user as any).plan || 'Básico',
    aiCredits: (session.user as any).aiCredits || 0,
    stripeCustomerId: (session.user as any).stripeCustomerId,
    createdAt: new Date().toISOString(), // Será carregado do banco posteriormente se necessário
  } : null;

  const refreshUser = useCallback(async () => {
    try {
      await update(); // Atualiza a sessão do NextAuth
      return user;
    } catch (error) {
      console.error('Error refreshing user:', error);
      return null;
    }
  }, [update, user]);

  const login = useCallback(async (email: string, password: string): Promise<UserProfile> => {
    try {
      const result = await nextAuthSignIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error('Email ou senha incorretos');
      }

      if (!result?.ok) {
        throw new Error('Erro ao fazer login');
      }

      // Aguardar a sessão ser carregada
      await new Promise(resolve => setTimeout(resolve, 500));
      await update();

      if (!user) {
        throw new Error('Erro ao carregar dados do usuário');
      }

      return user;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  }, [update, user]);

  const signup = useCallback(async (email: string, password: string, name: string): Promise<UserProfile> => {
    try {
      // Criar usuário no MongoDB
      const response = await fetch('/api/users/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar usuário');
      }

      // Fazer login automaticamente após signup
      return await login(email, password);
    } catch (error: any) {
      console.error('Signup error:', error);
      throw error;
    }
  }, [login]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await nextAuthSignOut({ redirect: false });
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }, []);

  const updateUser = useCallback(async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user) throw new Error('No user logged in');
    
    try {
      // Atualizar no banco de dados
      const response = await fetch('/api/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, updates }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar usuário');
      }

      // Atualizar sessão
      await update(updates);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }, [user, update]);

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    logout,
    updateUser,
    refreshUser,
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
