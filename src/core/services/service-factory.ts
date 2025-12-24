// src/core/services/service-factory.ts

import { IDatabaseAdapter } from '@/core/ports/database.port';
import { IAuthService } from '@/core/ports/auth.port';
import { IPaymentService } from '@/core/ports/payment.port';
import { MongoClient } from 'mongodb';

// Singleton factory class
class ServiceFactory {
  private static instance: ServiceFactory;
  private databaseAdapter: IDatabaseAdapter | null = null;
  private authService: IAuthService | null = null;
  private paymentService: IPaymentService | null = null;
  private mongoClient: MongoClient | null = null;

  // Promises para evitar race conditions na inicialização
  private databaseAdapterPromise: Promise<IDatabaseAdapter> | null = null;
  private authServicePromise: Promise<IAuthService> | null = null;
  private paymentServicePromise: Promise<IPaymentService> | null = null;

  private constructor() { }

  static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }

  async getDatabaseAdapter(): Promise<IDatabaseAdapter> {
    // Retorna o adapter já inicializado
    if (this.databaseAdapter) {
      return this.databaseAdapter;
    }

    // Se já existe uma promise de inicialização em andamento, aguarda ela
    if (this.databaseAdapterPromise) {
      return this.databaseAdapterPromise;
    }

    console.log('🔧 Initializing MongoDB database adapter...');

    // Cria a promise de inicialização e guarda para evitar race conditions
    this.databaseAdapterPromise = this.initializeMongoDBAdapter().then(() => {
      if (!this.databaseAdapter) {
        this.databaseAdapterPromise = null; // Reset on failure
        throw new Error('Failed to initialize database adapter');
      }
      return this.databaseAdapter;
    }).catch((error) => {
      this.databaseAdapterPromise = null; // Reset on failure to allow retry
      throw error;
    });

    return this.databaseAdapterPromise;
  }

  async getAuthService(): Promise<IAuthService> {
    if (this.authService) {
      return this.authService;
    }

    // Se já existe uma promise de inicialização em andamento, aguarda ela
    if (this.authServicePromise) {
      return this.authServicePromise;
    }

    this.authServicePromise = this.initializeMongoDBAuth().then(() => {
      if (!this.authService) {
        throw new Error('Failed to initialize auth service');
      }
      return this.authService;
    });

    console.log('🔧 Initializing MongoDB auth service...');
    return this.authServicePromise;
  }

  async getPaymentService(): Promise<IPaymentService> {
    if (this.paymentService) {
      return this.paymentService;
    }

    // Se já existe uma promise de inicialização em andamento, aguarda ela
    if (this.paymentServicePromise) {
      return this.paymentServicePromise;
    }

    this.paymentServicePromise = this.initializePaymentService().then(() => {
      if (!this.paymentService) {
        throw new Error('Failed to initialize payment service');
      }
      return this.paymentService;
    });

    console.log('🔧 Initializing payment service...');
    return this.paymentServicePromise;
  }

  private async initializeMongoDBAdapter(): Promise<void> {
    try {
      const { MongoDBAdapter } = await import('@/core/adapters/mongodb');
      this.databaseAdapter = new MongoDBAdapter();
      await this.databaseAdapter.connect();

      // Verificar se os repositórios foram inicializados corretamente
      if (!this.databaseAdapter.transactions) {
        this.databaseAdapter = null;
        throw new Error('MongoDB repositories were not initialized properly after connect()');
      }

      console.log('✅ MongoDB Database Adapter initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize MongoDB adapter:', error);
      this.databaseAdapter = null; // Garantir reset em caso de falha
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
        const isAtlas = uri.includes('mongodb.net') || uri.includes('mongodb+srv');
        const options = isAtlas ? {
          tls: true,
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 10000,
          socketTimeoutMS: 45000,
        } : {};

        this.mongoClient = new MongoClient(uri, options);
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

  private async initializePaymentService(): Promise<void> {
    try {
      // Get database adapter first (for payment repository)
      const databaseAdapter = await this.getDatabaseAdapter();

      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!stripeSecretKey || !webhookSecret) {
        throw new Error('Stripe configuration is missing. Please set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET environment variables');
      }

      const { StripePaymentAdapter } = await import('@/core/adapters/stripe');
      this.paymentService = new StripePaymentAdapter(
        databaseAdapter.payments,
        stripeSecretKey,
        webhookSecret
      );

      console.log('✅ Stripe Payment Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize payment service:', error);
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
      this.paymentService = null;
      console.log('✅ All services disconnected successfully');
    } catch (error) {
      console.error('❌ Error disconnecting services:', error);
      throw error;
    }
  }

  reset(): void {
    this.databaseAdapter = null;
    this.authService = null;
    this.paymentService = null;
    this.mongoClient = null;
  }

  getDatabaseType(): string {
    return 'mongodb';
  }

  isInitialized(): { database: boolean; auth: boolean; payment: boolean } {
    return {
      database: this.databaseAdapter !== null,
      auth: this.authService !== null,
      payment: this.paymentService !== null
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

export async function getPaymentService(): Promise<IPaymentService> {
  return serviceFactory.getPaymentService();
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

export function isServicesInitialized(): { database: boolean; auth: boolean; payment: boolean } {
  return serviceFactory.isInitialized();
}
