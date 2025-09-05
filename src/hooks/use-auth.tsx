// src/hooks/use-auth.tsx
'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { getAuthAdapter } from '@/services/auth/auth-service';
import { IAuthAdapter } from '@/services/auth/auth-adapter';
import { UserProfile } from '@/lib/types';
import { getDatabaseAdapter } from '@/services/database/database-service';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: IAuthAdapter['login'];
  signup: IAuthAdapter['signup'];
  logout: () => Promise<void>;
  signInWithGoogle: IAuthAdapter['signInWithGoogle'];
  sendPasswordReset: IAuthAdapter['sendPasswordReset'];
  updateUserProfile: (name: string) => Promise<void>;
  reauthenticate: IAuthAdapter['reauthenticate'];
  updateUserPassword: IAuthAdapter['updateUserPassword'];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  const authAdapter = useMemo(() => getAuthAdapter(), []);
  const dbAdapter = useMemo(() => getDatabaseAdapter(), []);

  const handleAuthChange = useCallback(async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
        // We have a firebase user, now get the full profile from our DB
        // This also handles creation on first login (e.g. social)
        let userProfile = await dbAdapter.getDoc<UserProfile>(`users/${firebaseUser.uid}`);
        
        if (!userProfile) {
            // User exists in auth provider but not our DB, create them
            const newUserProfileData: Omit<UserProfile, 'uid'|'id'> = {
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                plan: 'Básico',
                aiCredits: 0,
                createdAt: new Date().toISOString(),
            };
             await dbAdapter.setDoc(`users/${firebaseUser.uid}`, newUserProfileData);
             userProfile = await dbAdapter.getDoc<UserProfile>(`users/${firebaseUser.uid}`);
        }
        setUser(userProfile);
    } else {
        setUser(null);
    }
    setLoading(false);
  }, [dbAdapter]);
  
  useEffect(() => {
    setLoading(true);
    const unsubscribe = authAdapter.onAuthStateChanged(handleAuthChange);
    return () => unsubscribe();
  }, [authAdapter, handleAuthChange]);
  
  const login: IAuthAdapter['login'] = async (email, password) => {
    const loggedInUser = await authAdapter.login(email, password);
    setUser(loggedInUser);
    return loggedInUser;
  };
  
  const signup: IAuthAdapter['signup'] = async (email, password, name) => {
    const newUser = await authAdapter.signup(email, password, name);
    setUser(newUser);
    return newUser;
  };
  
  const signInWithGoogle: IAuthAdapter['signInWithGoogle'] = async () => {
    // onAuthStateChanged will handle profile creation/retrieval
    return await authAdapter.signInWithGoogle();
  };

  const logout = async () => {
    await authAdapter.logout();
    setUser(null);
  };

  const updateUserProfile = async (name: string) => {
    if (!user) throw new Error("User not authenticated");
    const updates = { displayName: name };
    await dbAdapter.updateDoc(`users/${user.uid}`, updates);
    setUser({ ...user, ...updates });
  };
  
  const sendPasswordReset: IAuthAdapter['sendPasswordReset'] = async (email) => {
    return authAdapter.sendPasswordReset(email);
  }

  const reauthenticate: IAuthAdapter['reauthenticate'] = async (password) => {
     if (!user) throw new Error("User not authenticated");
     return authAdapter.reauthenticate(password);
  }

  const updateUserPassword: IAuthAdapter['updateUserPassword'] = async (password) => {
    if (!user) throw new Error("User not authenticated");
    await authAdapter.updateUserPassword(password);
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    logout,
    signInWithGoogle,
    sendPasswordReset,
    updateUserProfile,
    reauthenticate,
    updateUserPassword
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
