// src/core/adapters/mongodb/mongodb-auth.adapter.ts

import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import { IAuthService } from '@/core/ports/auth.port';

interface User {
  _id?: ObjectId;
  email: string;
  passwordHash: string;
  displayName: string;
  plan: string;
  aiCredits: number;
  createdAt: string;
  stripeCustomerId?: string;
  resetToken?: string;
  resetExpires?: Date;
}

interface Session {
  _id?: ObjectId;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

interface SignUpData {
  email: string;
  password: string;
  displayName: string;
}

interface LoginData {
  email: string;
  password: string;
}

export class MongoDBAuthService implements IAuthService {
  private db: Db | null = null;
  private userCollection!: Collection<User>;
  private sessionCollection!: Collection<Session>;
  private currentUserId: string | null = null;
  private authStateCallbacks: ((user: any) => void)[] = [];

  constructor(private client: MongoClient, private dbName: string) { }

  async connect(): Promise<void> {
    if (!this.db) {
      this.db = this.client.db(this.dbName);
      this.userCollection = this.db.collection<User>('users');
      this.sessionCollection = this.db.collection<Session>('sessions');
    }
  }

  private generateToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private hashPassword(password: string): string {
    // Simple hash for demo - in production use bcrypt
    const hash = require('crypto').createHash('sha256');
    hash.update(password);
    return hash.digest('hex');
  }

  private verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }

  private notifyAuthStateChanged(user: any): void {
    this.authStateCallbacks.forEach(callback => callback(user));
  }

  async signUp(data: SignUpData): Promise<{ user: any; success: boolean; error?: string }> {
    try {
      await this.connect();

      // Check if user already exists
      const existingUser = await this.userCollection.findOne({ email: data.email });
      if (existingUser) {
        return {
          user: null,
          success: false,
          error: 'Este email já está em uso'
        };
      }

      // Hash password
      const passwordHash = this.hashPassword(data.password);

      // Create user
      const newUser: Omit<User, '_id'> = {
        email: data.email,
        passwordHash,
        displayName: data.displayName,
        plan: 'Básico',
        aiCredits: 10, // Free credits for new users
        createdAt: new Date().toISOString()
      };

      const result = await this.userCollection.insertOne(newUser);
      const userId = result.insertedId.toString();

      // Create session
      const token = this.generateToken();
      await this.sessionCollection.insertOne({
        userId,
        token,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdAt: new Date()
      });

      this.currentUserId = userId;

      const userResponse = {
        uid: userId,
        email: data.email,
        displayName: data.displayName,
        plan: 'Básico',
        aiCredits: 10
      };

      // Configurar dados padrão para o novo usuário (categorias, configurações, etc.)
      try {
        const { setupDefaultUserData } = await import('@/services/default-setup-service');
        await setupDefaultUserData(userId);
      } catch (setupError) {
        console.error('Erro ao configurar dados padrão:', setupError);
        // Não falha o cadastro se houver erro na configuração padrão
      }

      this.notifyAuthStateChanged(userResponse);

      return {
        user: userResponse,
        success: true
      };
    } catch (error: any) {
      return {
        user: null,
        success: false,
        error: 'Erro ao criar usuário: ' + error.message
      };
    }
  }

  async signIn(data: LoginData): Promise<{ user: any; success: boolean; error?: string }> {
    try {
      await this.connect();

      // Find user
      const user = await this.userCollection.findOne({ email: data.email });
      if (!user) {
        return {
          user: null,
          success: false,
          error: 'Email ou senha incorretos'
        };
      }

      // Verify password
      const isPasswordValid = this.verifyPassword(data.password, user.passwordHash);
      if (!isPasswordValid) {
        return {
          user: null,
          success: false,
          error: 'Email ou senha incorretos'
        };
      }

      // Create session
      const token = this.generateToken();
      const userId = user._id!.toString();

      await this.sessionCollection.insertOne({
        userId,
        token,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdAt: new Date()
      });

      this.currentUserId = userId;

      const userResponse = {
        uid: userId,
        email: user.email,
        displayName: user.displayName,
        plan: user.plan,
        aiCredits: user.aiCredits
      };

      this.notifyAuthStateChanged(userResponse);

      return {
        user: userResponse,
        success: true
      };
    } catch (error: any) {
      return {
        user: null,
        success: false,
        error: 'Erro ao fazer login: ' + error.message
      };
    }
  }

  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.currentUserId) {
        await this.connect();
        await this.sessionCollection.deleteMany({ userId: this.currentUserId });
        this.currentUserId = null;
        this.notifyAuthStateChanged(null);
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: 'Erro ao fazer logout: ' + error.message
      };
    }
  }

  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.connect();

      // Check if user exists
      const user = await this.userCollection.findOne({ email });
      if (!user) {
        return {
          success: false,
          error: 'Usuário não encontrado'
        };
      }

      // Generate reset token (simplified)
      const resetToken = Math.random().toString(36).substring(2, 15);
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour

      await this.userCollection.updateOne(
        { email },
        {
          $set: {
            resetToken,
            resetExpires
          }
        }
      );

      // In a real implementation, you would send an email with the reset token
      console.log(`Password reset token for ${email}: ${resetToken}`);

      return {
        success: true
      };
    } catch (error: any) {
      return {
        success: false,
        error: 'Erro ao enviar email de redefinição: ' + error.message
      };
    }
  }

  async updateUserProfile(userId: string, updates: { displayName?: string; email?: string }): Promise<{ success: boolean; error?: string }> {
    try {
      await this.connect();

      const result = await this.userCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: updates }
      );

      if (result.matchedCount === 0) {
        return {
          success: false,
          error: 'Usuário não encontrado'
        };
      }

      // Update current user if it's the same user
      if (this.currentUserId === userId) {
        const updatedUser = await this.userCollection.findOne({ _id: new ObjectId(userId) });
        if (updatedUser) {
          const userResponse = {
            uid: userId,
            email: updatedUser.email,
            displayName: updatedUser.displayName,
            plan: updatedUser.plan,
            aiCredits: updatedUser.aiCredits
          };
          this.notifyAuthStateChanged(userResponse);
        }
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: 'Erro ao atualizar perfil: ' + error.message
      };
    }
  }

  async changePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.currentUserId) {
        return {
          success: false,
          error: 'Usuário não autenticado'
        };
      }

      await this.connect();

      const passwordHash = this.hashPassword(newPassword);

      const result = await this.userCollection.updateOne(
        { _id: new ObjectId(this.currentUserId) },
        { $set: { passwordHash } }
      );

      if (result.matchedCount === 0) {
        return {
          success: false,
          error: 'Usuário não encontrado'
        };
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: 'Erro ao alterar senha: ' + error.message
      };
    }
  }

  async getCurrentUser(): Promise<any> {
    try {
      await this.connect();

      // If we have a current user ID, use it
      if (this.currentUserId) {
        const user = await this.userCollection.findOne({ _id: new ObjectId(this.currentUserId) });
        if (user) {
          return {
            uid: user._id!.toString(),
            email: user.email,
            displayName: user.displayName,
            plan: user.plan,
            aiCredits: user.aiCredits,
            stripeCustomerId: user.stripeCustomerId,
            createdAt: user.createdAt
          };
        }
      }

      // Try to find an active session (simplified for this environment)
      // In a real app, you'd check cookies/headers for session tokens
      const activeSession = await this.sessionCollection.findOne(
        { expiresAt: { $gt: new Date() } },
        { sort: { createdAt: -1 } }
      );

      if (activeSession) {
        const user = await this.userCollection.findOne({ _id: new ObjectId(activeSession.userId) });
        if (user) {
          this.currentUserId = user._id!.toString();
          return {
            uid: user._id!.toString(),
            email: user.email,
            displayName: user.displayName,
            plan: user.plan,
            aiCredits: user.aiCredits,
            stripeCustomerId: user.stripeCustomerId,
            createdAt: user.createdAt
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async deleteAccount(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.connect();

      if (!this.db) {
        throw new Error('Database not connected');
      }

      await this.userCollection.deleteOne({ _id: new ObjectId(userId) });

      // Also delete related data
      await this.db.collection('transactions').deleteMany({ userId });
      await this.db.collection('wallets').deleteMany({ userId });
      await this.db.collection('budgets').deleteMany({ userId });
      await this.db.collection('aiCreditLogs').deleteMany({ userId });
      await this.sessionCollection.deleteMany({ userId });

      if (this.currentUserId === userId) {
        this.currentUserId = null;
        this.notifyAuthStateChanged(null);
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: 'Erro ao excluir conta: ' + error.message
      };
    }
  }

  onAuthStateChanged(callback: (user: any) => void): () => void {
    this.authStateCallbacks.push(callback);

    // Immediately call with current state
    this.getCurrentUser().then(callback);

    // Return unsubscribe function
    return () => {
      const index = this.authStateCallbacks.indexOf(callback);
      if (index > -1) {
        this.authStateCallbacks.splice(index, 1);
      }
    };
  }
}
