// src/core/ports/auth.port.ts

interface SignUpData {
  email: string;
  password: string;
  displayName: string;
}

interface LoginData {
  email: string;
  password: string;
}

export interface IAuthService {
  signUp(data: SignUpData): Promise<{ user: any; success: boolean; error?: string }>;
  signIn(data: LoginData): Promise<{ user: any; success: boolean; error?: string }>;
  signOut(): Promise<{ success: boolean; error?: string }>;
  resetPassword(email: string): Promise<{ success: boolean; error?: string }>;
  updateUserProfile(userId: string, updates: { displayName?: string; email?: string }): Promise<{ success: boolean; error?: string }>;
  changePassword(newPassword: string): Promise<{ success: boolean; error?: string }>;
  getCurrentUser(): Promise<any>;
  deleteAccount(userId: string): Promise<{ success: boolean; error?: string }>;
  onAuthStateChanged(callback: (user: any) => void): () => void;
}
