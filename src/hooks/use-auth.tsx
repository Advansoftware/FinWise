
'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {
  onIdTokenChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  User,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword
} from 'firebase/auth';
import { getFirebase } from '@/lib/firebase';
import { getDatabaseAdapter } from '@/services/database/database-service';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<any>;
  signup: (email: string, pass: string, name: string) => Promise<any>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<any>;
  sendPasswordReset: (email: string) => Promise<void>;
  updateUserProfile: (name: string) => Promise<void>;
  reauthenticate: (password: string) => Promise<void>;
  updateUserPassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { auth, db } = getFirebase();
  const dbAdapter = getDatabaseAdapter();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Ensure user profile exists in the database
        await dbAdapter.ensureUserProfile(user);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, dbAdapter]);

  const login = (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };
  
  const signup = (email: string, pass: string, name: string) => {
    return createUserWithEmailAndPassword(auth, email, pass).then(async (userCredential) => {
        await updateProfile(userCredential.user, { displayName: name });
        // The onIdTokenChanged listener will handle profile creation
        return userCredential;
    });
  };

  const logout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
    // The onIdTokenChanged listener will handle profile creation
  };
  
  const sendPasswordReset = (email: string) => {
    return sendPasswordResetEmail(auth, email);
  }

  const updateUserProfile = async (name: string) => {
    if (!auth.currentUser) throw new Error("User not authenticated");
    await updateProfile(auth.currentUser, { displayName: name });
    
    await dbAdapter.updateDoc(`users/${auth.currentUser.uid}`, { displayName: name });
    
    setUser(auth.currentUser ? { ...auth.currentUser } : null);
  }

  const reauthenticate = async (password: string) => {
    if (!auth.currentUser || !auth.currentUser.email) throw new Error("User not authenticated or email is missing");
    const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
    await reauthenticateWithCredential(auth.currentUser, credential);
  }

  const updateUserPassword = async (password: string) => {
    if (!auth.currentUser) throw new Error("User not authenticated");
    await updatePassword(auth.currentUser, password);
  }

  const value = {
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
