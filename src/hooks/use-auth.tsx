
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
      const userProfile = await dbAdapter.getDoc<UserProfile>(`users/${firebaseUser.uid}`);
      if (userProfile) {
        setUser(userProfile);
      } else {
        // This case can happen with Google Sign-in for the first time
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
    const authProvider = process.env.NEXT_PUBLIC_AUTH_PROVIDER || 'firebase';

    if (authProvider === 'firebase') {
      // This listener handles Firebase-based auth state (Google, or if Firebase is auth provider)
      const unsubscribe = authAdapter.onAuthStateChanged(handleAuthChange);
      return () => unsubscribe();
    } else {
      // For mongodb provider, we check session from localStorage
      try {
        const session = localStorage.getItem('finwise_session');
        if (session) {
          const userProfile = JSON.parse(session);
          setUser(userProfile);
        }
      } catch (error) {
        console.error("Failed to parse local session", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
  }, [authAdapter, handleAuthChange]);
  
  const login: IAuthAdapter['login'] = async (email, password) => {
    setLoading(true);
    try {
      const loggedInUser = await authAdapter.login(email, password);
      setUser(loggedInUser);
      return loggedInUser;
    } finally {
      setLoading(false);
    }
  };
  
  const signup: IAuthAdapter['signup'] = async (email, password, name) => {
    setLoading(true);
    try {
      const signedUpUser = await authAdapter.signup(email, password, name);
      setUser(signedUpUser);
      return signedUpUser;
    } finally {
      setLoading(false);
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
  
  const sendPasswordReset = async (email: string) => {
    return authAdapter.sendPasswordReset(email);
  }

  const reauthenticate: IAuthAdapter['reauthenticate'] = async (password: string) => {
     if (!user) throw new Error("User not authenticated");
     return authAdapter.reauthenticate(password);
  }

  const updateUserPassword: IAuthAdapter['updateUserPassword'] = async (password: string) => {
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
