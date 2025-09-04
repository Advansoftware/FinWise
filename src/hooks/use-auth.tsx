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
import { MongoDbAdapter } from '@/services/database/mongodb-adapter';


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

  const handleAuthChange = useCallback(async (firebaseUser: FirebaseUser | null) => {
    if (dbAdapter instanceof MongoDbAdapter) {
        dbAdapter.setCurrentUser(firebaseUser?.uid || null);
    }
    
    if (firebaseUser) {
      const userProfile = await dbAdapter.getDoc<UserProfile>(`users/${firebaseUser.uid}`);
      if (userProfile) {
        setUser(userProfile);
      } else {
        // This can happen briefly during signup before the profile is available.
        // It will be resolved by the login/signup methods setting the user state.
        console.warn(`Profile for user ${firebaseUser.uid} not found in DB. This might be a race condition during signup.`);
      }
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
    setLoading(true);
    try {
      const loggedInUser = await authAdapter.login(email, password);
      // For Mongo, the profile is returned directly. For Firebase, the onAuthStateChanged listener handles it.
      if (loggedInUser) {
        setUser(loggedInUser);
      }
      return loggedInUser;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      // Let the onAuthStateChanged listener set loading to false to ensure profile is fetched.
    }
  };
  
  const signup: IAuthAdapter['signup'] = async (email, password, name) => {
    setLoading(true);
    try {
      const newUser = await authAdapter.signup(email, password, name);
      // For Mongo, the profile is returned directly. For Firebase, the onAuthStateChanged listener handles it.
       if (newUser) {
        setUser(newUser);
      }
      return newUser;
    } catch (error) {
       setUser(null);
       throw error;
    } finally {
       // Let the onAuthStateChanged listener set loading to false to ensure profile is fetched.
    }
  };
  
  const signInWithGoogle: IAuthAdapter['signInWithGoogle'] = async () => {
    setLoading(true);
    try {
      const googleUser = await authAdapter.signInWithGoogle();
       if (googleUser) {
        setUser(googleUser);
      }
      return googleUser;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      // Let the onAuthStateChanged listener set loading to false
    }
  };

  const logout = async () => {
    await authAdapter.logout();
    setUser(null);
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
