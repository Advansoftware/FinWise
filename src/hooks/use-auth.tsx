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
import { getAuthAdapter, IAuthAdapter } from '@/services/auth/auth-service';
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
        // Ensure profile exists, especially for social logins or new signups.
        let userProfile = await dbAdapter.getDoc<UserProfile>(`users/${firebaseUser.uid}`);
        
        if (!userProfile) {
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
    setLoading(true);
    try {
      const loggedInUser = await authAdapter.login(email, password);
      setUser(loggedInUser); // onAuthStateChanged will also fire, this is for immediate UI update
      return loggedInUser;
    } catch (error) {
      setUser(null);
      setLoading(false);
      throw error;
    }
  };
  
  const signup: IAuthAdapter['signup'] = async (email, password, name) => {
    setLoading(true);
    try {
      const newUser = await authAdapter.signup(email, password, name);
       setUser(newUser); // onAuthStateChanged will also fire
      return newUser;
    } catch (error) {
       setUser(null);
       setLoading(false);
       throw error;
    }
  };
  
  const signInWithGoogle: IAuthAdapter['signInWithGoogle'] = async () => {
    setLoading(true);
    try {
      const googleUser = await authAdapter.signInWithGoogle();
       // onAuthStateChanged will handle setting the user state and creating the profile
      return googleUser;
    } catch (error) {
      setUser(null);
      setLoading(false);
      throw error;
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
    await dbAdapter.updateDoc(`users/${user.uid}`, { password: 'password_update_not_supported_on_client' });
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
