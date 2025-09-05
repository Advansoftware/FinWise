// src/core/adapters/firebase/firebase-auth.adapter.ts

import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  updatePassword,
  User,
  UserCredential
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { IAuthService } from '@/core/ports/auth.port';

interface SignUpData {
  email: string;
  password: string;
  displayName: string;
}

interface LoginData {
  email: string;
  password: string;
}

export class FirebaseAuthService implements IAuthService {
  private auth = getAuth(getApp());
  private db = getFirestore(getApp());

  async signUp(data: SignUpData): Promise<{ user: any; success: boolean; error?: string }> {
    try {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        this.auth,
        data.email,
        data.password
      );

      const user = userCredential.user;

      // Update the user profile with display name
      await updateProfile(user, {
        displayName: data.displayName
      });

      // Create user document in Firestore
      await setDoc(doc(this.db, 'users', user.uid), {
        email: user.email,
        displayName: data.displayName,
        plan: 'Básico',
        aiCredits: 10, // Free credits for new users
        createdAt: new Date().toISOString()
      });

      return {
        user: {
          uid: user.uid,
          email: user.email,
          displayName: data.displayName
        },
        success: true
      };
    } catch (error: any) {
      return {
        user: null,
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  async signIn(data: LoginData): Promise<{ user: any; success: boolean; error?: string }> {
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        this.auth,
        data.email,
        data.password
      );

      const user = userCredential.user;

      // Get additional user data from Firestore
      const userDoc = await getDoc(doc(this.db, 'users', user.uid));
      const userData = userDoc.data();

      return {
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          plan: userData?.plan || 'Básico',
          aiCredits: userData?.aiCredits || 0
        },
        success: true
      };
    } catch (error: any) {
      return {
        user: null,
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      await signOut(this.auth);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      await sendPasswordResetEmail(this.auth, email);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  async updateUserProfile(userId: string, updates: { displayName?: string; email?: string }): Promise<{ success: boolean; error?: string }> {
    try {
      const user = this.auth.currentUser;
      if (!user || user.uid !== userId) {
        return {
          success: false,
          error: 'Usuário não autenticado ou ID inválido'
        };
      }

      // Update Firebase Auth profile
      if (updates.displayName) {
        await updateProfile(user, {
          displayName: updates.displayName
        });
      }

      // Update Firestore document
      await setDoc(doc(this.db, 'users', userId), updates, { merge: true });

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  async changePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        return {
          success: false,
          error: 'Usuário não autenticado'
        };
      }

      await updatePassword(user, newPassword);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  async getCurrentUser(): Promise<any> {
    const user = this.auth.currentUser;
    if (!user) return null;

    // Get additional user data from Firestore
    const userDoc = await getDoc(doc(this.db, 'users', user.uid));
    const userData = userDoc.data();

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      plan: userData?.plan || 'Básico',
      aiCredits: userData?.aiCredits || 0
    };
  }

  async deleteAccount(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = this.auth.currentUser;
      if (!user || user.uid !== userId) {
        return {
          success: false,
          error: 'Usuário não autenticado ou ID inválido'
        };
      }

      // Delete user data from Firestore first
      // This would require admin privileges or a cloud function
      // For now, we'll just delete the auth account

      await user.delete();
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  onAuthStateChanged(callback: (user: any) => void): () => void {
    return this.auth.onAuthStateChanged(async (user: User | null) => {
      if (user) {
        // Get additional user data from Firestore
        const userDoc = await getDoc(doc(this.db, 'users', user.uid));
        const userData = userDoc.data();

        callback({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          plan: userData?.plan || 'Básico',
          aiCredits: userData?.aiCredits || 0
        });
      } else {
        callback(null);
      }
    });
  }

  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'Usuário não encontrado';
      case 'auth/wrong-password':
        return 'Senha incorreta';
      case 'auth/email-already-in-use':
        return 'Este email já está em uso';
      case 'auth/weak-password':
        return 'A senha deve ter pelo menos 6 caracteres';
      case 'auth/invalid-email':
        return 'Email inválido';
      case 'auth/user-disabled':
        return 'Esta conta foi desabilitada';
      case 'auth/too-many-requests':
        return 'Muitas tentativas. Tente novamente mais tarde';
      case 'auth/operation-not-allowed':
        return 'Operação não permitida';
      case 'auth/requires-recent-login':
        return 'Esta operação requer autenticação recente';
      default:
        return 'Erro desconhecido. Tente novamente';
    }
  }
}
