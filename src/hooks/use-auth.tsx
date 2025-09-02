
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
import { doc, setDoc, getDoc } from 'firebase/firestore';
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
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const login = (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };
  
  const signup = async (email: string, pass: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(userCredential.user, { displayName: name });
    
    await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        displayName: name,
        email: email,
        createdAt: new Date(),
        plan: 'Básico'
    });

    return userCredential;
  };

  const logout = async () => {
    await signOut(auth);
    // Redireciona explicitamente para a página de login após o logout.
    router.push('/login');
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);

    const userDocRef = doc(db, "users", userCredential.user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
            uid: userCredential.user.uid,
            displayName: userCredential.user.displayName,
            email: userCredential.user.email,
            createdAt: new Date(),
            plan: 'Básico'
        });
    }

    return userCredential;
  };
  
  const sendPasswordReset = (email: string) => {
    return sendPasswordResetEmail(auth, email);
  }

  const updateUserProfile = async (name: string) => {
    if (!auth.currentUser) throw new Error("User not authenticated");
    await updateProfile(auth.currentUser, { displayName: name });
    
    const userDocRef = doc(db, "users", auth.currentUser.uid);
    await setDoc(userDocRef, { displayName: name }, { merge: true });
    
    // Create a new object to trigger re-render
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
