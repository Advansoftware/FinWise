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
import { User as FirebaseUser } from 'firebase/auth';
import { getAuthAdapter, IAuthAdapter } from '@/services/auth/auth-service';
import { useRouter } from 'next/navigation';
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
  const authAdapter = getAuthAdapter();
  const dbAdapter = getDatabaseAdapter();
  const router = useRouter();

  const handleAuthChange = useCallback(async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      // This logic will run for both Firebase Auth and MongoDB (which returns a Firebase-like user object)
      const userProfile = await dbAdapter.getDoc<UserProfile>(`users/${firebaseUser.uid}`);
      
      if (userProfile) {
        setUser(userProfile);
      } else {
        // This case can happen with Google Sign-in for the first time
        // or if the user was deleted from the DB but not from the auth provider.
        await dbAdapter.ensureUserProfile(firebaseUser);
        const newUserProfile = await dbAdapter.getDoc<UserProfile>(`users/${firebaseUser.uid}`);
        setUser(newUserProfile);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [dbAdapter]);
  
  useEffect(() => {
    // onAuthStateChanged is now an abstract method that works for both adapters.
    // The specific adapter (Mongo or Firebase) will handle its own session logic.
    setLoading(true);
    const unsubscribe = authAdapter.onAuthStateChanged(handleAuthChange);
    return () => unsubscribe();
  }, [authAdapter, handleAuthChange]);
  
  const login: IAuthAdapter['login'] = async (email, password) => {
    setLoading(true);
    try {
      const loggedInUser = await authAdapter.login(email, password);
      // The onAuthStateChanged listener will handle setting the user state.
      return loggedInUser;
    } finally {
      // Don't setLoading(false) here, as the listener will do it.
    }
  };
  
  const signup: IAuthAdapter['signup'] = async (email, password, name) => {
    setLoading(true);
    try {
      const signedUpUser = await authAdapter.signup(email, password, name);
      // The onAuthStateChanged listener will handle setting the user state.
      return signedUpUser;
    } finally {
       // Don't setLoading(false) here, as the listener will do it.
    }
  };
  
  const signInWithGoogle: IAuthAdapter['signInWithGoogle'] = async () => {
    setLoading(true);
    // Google Sign-In will be handled by the onAuthStateChanged listener
    return await authAdapter.signInWithGoogle();
  };

  const logout = async () => {
    await authAdapter.logout();
    setUser(null);
    router.push('/login');
  };

  const updateUserProfile = async (name: string) => {
    if (!user) throw new Error("User not authenticated");
    await dbAdapter.updateDoc(`users/${user.uid}`, { displayName: name });
    setUser({ ...user, displayName: name });
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
    return authAdapter.updateUserPassword(password);
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
