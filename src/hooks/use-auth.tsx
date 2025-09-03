
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
import { UserPlan } from '@/lib/types';


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
  const { auth } = getFirebase();
  const dbAdapter = getDatabaseAdapter();
  const router = useRouter();


  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Ensure user profile exists in the database using the adapter
        await dbAdapter.ensureUserProfile(user);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, dbAdapter]);

  const login = async (email: string, pass: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    if (userCredential.user) {
      await dbAdapter.ensureUserProfile(userCredential.user);
    }
    return userCredential;
  };
  
  const signup = (email: string, pass: string, name: string) => {
    return createUserWithEmailAndPassword(auth, email, pass).then(async (userCredential) => {
        await updateProfile(userCredential.user, { displayName: name });
        // The onIdTokenChanged listener will handle profile creation via the adapter
        setUser(auth.currentUser ? { ...auth.currentUser } : null); // Force re-render to trigger listener effect
        return userCredential;
    });
  };

  const logout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    // The onIdTokenChanged listener handles profile creation, but we can ensure it here as well
    if (result.user) {
        await dbAdapter.ensureUserProfile(result.user);
    }
    return result;
  };
  
  const sendPasswordReset = (email: string) => {
    return sendPasswordResetEmail(auth, email);
  }

  const updateUserProfile = async (name: string) => {
    if (!auth.currentUser) throw new Error("User not authenticated");
    await updateProfile(auth.currentUser, { displayName: name });
    
    // Use the adapter to update the user's profile in the database
    await dbAdapter.updateDoc(`users/${auth.currentUser.uid}`, { displayName: name });
    
    // Force a re-render to reflect the change immediately in the UI
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
