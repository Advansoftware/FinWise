'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
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
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';

// This is a simplified way to pass the auth token to server actions.
// In a production app, you might use a dedicated library or a more robust fetch wrapper.
const setAuthToken = (token: string | null) => {
  if (typeof window !== 'undefined') {
    (window as any).__FIREBASE_ID_TOKEN__ = token;
  }
};

const originalFetch = typeof window !== 'undefined' ? window.fetch : () => Promise.reject(new Error('fetch is not available'));

if (typeof window !== 'undefined') {
    window.fetch = async (input, init) => {
        const token = (window as any).__FIREBASE_ID_TOKEN__;
        if (token) {
            const headers = new Headers(init?.headers);
            headers.set('Authorization', `Bearer ${token}`);
            const newInit = { ...init, headers };
            return originalFetch(input, newInit);
        }
        return originalFetch(input, init);
    };
}


interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<any>;
  signup: (email: string, pass: string, name: string) => Promise<any>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<any>;
  sendPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  signInWithGoogle: async () => {},
  sendPasswordReset: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      setUser(user);
      const token = user ? await user.getIdToken() : null;
      setAuthToken(token);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthRedirect = useCallback(() => {
      if (loading) return;
      const isAuthPage = pathname === '/login' || pathname === '/signup';

      if (!user && !isAuthPage) {
          router.push('/login');
      } else if (user && isAuthPage) {
          router.push('/');
      }
  }, [user, loading, pathname, router]);

  useEffect(() => {
    handleAuthRedirect();
  }, [handleAuthRedirect]);

  const login = (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };
  
  const signup = async (email: string, pass: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(userCredential.user, { displayName: name });
    
    // Create a user document in Firestore
    await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        displayName: name,
        email: email,
        createdAt: new Date(),
    });

    return userCredential;
  };

  const logout = async () => {
    setUser(null);
    setAuthToken(null);
    await signOut(auth);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);

    // Create user doc if it's a new user
    const userDocRef = doc(db, "users", userCredential.user.uid);
     await setDoc(userDocRef, {
        uid: userCredential.user.uid,
        displayName: userCredential.user.displayName,
        email: userCredential.user.email,
        createdAt: new Date(),
    }, { merge: true });

    return userCredential;
  };
  
  const sendPasswordReset = (email: string) => {
    return sendPasswordResetEmail(auth, email);
  }

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    signInWithGoogle,
    sendPasswordReset,
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
