
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
import { getDatabase, ref, onValue, remove } from "firebase/database";
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
  const { auth, rtdb } = getFirebase();
  const dbAdapter = getDatabaseAdapter();
  const router = useRouter();

  // Command listener for server-to-client updates
  useEffect(() => {
    if (!user) {
        return;
    }

    const commandRef = ref(rtdb, `commands/${user.uid}`);
    
    const unsubscribe = onValue(commandRef, (snapshot) => {
        const command = snapshot.val();
        if (command) {
            console.log("Received command from server:", command);
            handleServerCommand(command);
            // Remove the command after processing to prevent re-execution
            remove(commandRef);
        }
    });

    return () => unsubscribe();
  }, [user, rtdb]);

  const handleServerCommand = async (command: any) => {
    if (!command || !command.action) return;

    switch(command.action) {
        case 'SET_USER_PLAN':
            const { plan, aiCredits, stripeCustomerId, stripeSubscriptionId, stripeCurrentPeriodEnd } = command.payload as { plan: UserPlan, aiCredits: number, stripeCustomerId?: string, stripeSubscriptionId?: string, stripeCurrentPeriodEnd?: string };
            try {
                await dbAdapter.setDoc(`users/${user!.uid}`, {
                    plan,
                    aiCredits,
                    stripeCustomerId,
                    stripeSubscriptionId,
                    stripeCurrentPeriodEnd,
                });
                console.log(`User plan updated to ${plan} via server command.`);
            } catch (error) {
                console.error("Failed to execute SET_USER_PLAN command:", error);
            }
            break;
        case 'DOWNGRADE_USER_PLAN':
            try {
                 await dbAdapter.setDoc(`users/${user!.uid}`, {
                    plan: 'Básico',
                    aiCredits: 0,
                    stripeSubscriptionId: null,
                    stripeCurrentPeriodEnd: null,
                });
                console.log(`User plan downgraded to Básico via server command.`);
            } catch(error) {
                 console.error("Failed to execute DOWNGRADE_USER_PLAN command:", error);
            }
            break;
        default:
            console.warn("Unknown server command received:", command.action);
    }
  }


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
