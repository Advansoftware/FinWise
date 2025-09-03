
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
    // This listener handles Firebase-based auth state (Google, or if Firebase is auth provider)
    const unsubscribe = authAdapter.onAuthStateChanged(handleAuthChange);
    return () => unsubscribe();
  }, [authAdapter, handleAuthChange]);
  
  const login: IAuthAdapter['login'] = async (email, password) => {
    setLoading(true);
    const loggedInUser = await authAdapter.login(email, password);
    setUser(loggedInUser);
    setLoading(false);
    return loggedInUser;
  };
  
  const signup: IAuthAdapter['signup'] = async (email, password, name) => {
    setLoading(true);
    const signedUpUser = await authAdapter.signup(email, password, name);
    setUser(signedUpUser);
    setLoading(false);
    return signedUpUser;
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

  const updateUserPassword: IAuthalização/adapter.ts' file was not found.
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
