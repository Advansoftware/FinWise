// src/core/services/service-factory.ts

import { IDatabaseAdapter } from '@/core/ports/database.port';
import { IAuthService } from '@/core/ports/auth.port';
import { MongoClient } from 'mongodb';

// Singleton factory class
class ServiceFactory {
  private static instance: ServiceFactory;
  private databaseAdapter: IDatabaseAdapter | null = null;
  private authService: IAuthService | null = null;
  private mongoClient: MongoClient | null = null;

  private constructor() { }

  static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }

  async getDatabaseAdapter(): Promise<IDatabaseAdapter> {
    if (this.databaseAdapter) {
      return this.databaseAdapter;
    }

    console.log('🔧 Initializing MongoDB database adapter...');
    await this.initializeMongoDBAdapter();

    if (!this.databaseAdapter) {
      throw new Error('Failed to initialize database adapter');
    }

    return this.databaseAdapter;
  }

  async getAuthService(): Promise<IAuthService> {
    if (this.authService) {
      return this.authService;
    }

    console.log('🔧 Initializing MongoDB auth service...');
    await this.initializeMongoDBAuth();

    if (!this.authService) {
      throw new Error('Failed to initialize auth service');
    }

    return this.authService;
  }

  private async initializeMongoDBAdapter(): Promise<void> {
    try {
      const { MongoDBAdapter } = await import('@/core/adapters/mongodb');
      this.databaseAdapter = new MongoDBAdapter();
      await this.databaseAdapter.connect();

      console.log('✅ MongoDB Database Adapter initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize MongoDB adapter:', error);
      throw error;
    }
  }

  private async initializeMongoDBAuth(): Promise<void> {
    try {
      const uri = process.env.MONGODB_URI;
      const dbName = process.env.MONGODB_DB || 'gastometria';

      if (!uri) {
        throw new Error('MONGODB_URI environment variable is required when using MongoDB');
      }

      if (!this.mongoClient) {
        this.mongoClient = new MongoClient(uri);
        await this.mongoClient.connect();
      }

      const { MongoDBAuthService } = await import('@/core/adapters/mongodb');
      this.authService = new MongoDBAuthService(this.mongoClient, dbName);

      console.log('✅ MongoDB Auth Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize MongoDB auth service:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.databaseAdapter) {
        await this.databaseAdapter.disconnect();
        this.databaseAdapter = null;
      }

      if (this.mongoClient) {
        await this.mongoClient.close();
        this.mongoClient = null;
      }

      this.authService = null;
      console.log('✅ All services disconnected successfully');
    } catch (error) {
      console.error('❌ Error disconnecting services:', error);
      throw error;
    }
  }

  reset(): void {
    this.databaseAdapter = null;
    this.authService = null;
    this.mongoClient = null;
  }

  getDatabaseType(): string {
    return 'mongodb';
  }

  isInitialized(): { database: boolean; auth: boolean } {
    return {
      database: this.databaseAdapter !== null,
      auth: this.authService !== null
    };
  }
}

// Export singleton instance and convenience functions
const serviceFactory = ServiceFactory.getInstance();

export async function getDatabaseAdapter(): Promise<IDatabaseAdapter> {
  return serviceFactory.getDatabaseAdapter();
}

export async function getAuthService(): Promise<IAuthService> {
  return serviceFactory.getAuthService();
}

export async function disconnectServices(): Promise<void> {
  return serviceFactory.disconnect();
}

export function resetServices(): void {
  return serviceFactory.reset();
}

export function getDatabaseType(): string {
  return serviceFactory.getDatabaseType();
}

export function isServicesInitialized(): { database: boolean; auth: boolean } {
  return serviceFactory.isInitialized();
}
