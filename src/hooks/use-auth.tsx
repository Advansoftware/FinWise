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
import { getFirebase } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';

// Este objeto é um fallback para garantir que o fetch funcione no lado do servidor
// onde 'window' não existe. As Server Actions usarão o token de qualquer maneira.
const fetchWrapper = {
    originalFetch: typeof window !== 'undefined' ? window.fetch : () => Promise.reject(new Error('fetch is not available')),
    idToken: null as string | null,
};

// Intercepta o fetch global para injetar o token de autenticação.
if (typeof window !== 'undefined') {
    window.fetch = async (input, init) => {
        const headers = new Headers(init?.headers);
        if (fetchWrapper.idToken) {
            headers.set('Authorization', `Bearer ${fetchWrapper.idToken}`);
        }
        const newInit = { ...init, headers };
        return fetchWrapper.originalFetch.call(window, input, newInit);
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
  const { auth, db } = getFirebase(); // Get initialized services

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      setUser(user);
      fetchWrapper.idToken = user ? await user.getIdToken(true) : null; // Força a atualização do token
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

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
    await signOut(auth);
    fetchWrapper.idToken = null; // Limpa o token no logout
    setUser(null);
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
