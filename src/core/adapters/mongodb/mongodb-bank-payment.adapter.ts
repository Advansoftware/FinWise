// src/core/adapters/mongodb/mongodb-bank-payment.adapter.ts

import { Db, ObjectId } from 'mongodb';
import {
  IBankPaymentRepository,
  PaymentContact,
  UserDevice,
  PaymentRequest,
  PaymentEvent,
  PushConfig,
  CreateContactInput,
  UpdateContactInput,
  RegisterDeviceInput,
  RequestPaymentInput,
  PaymentRequestStatus,
} from '@/core/ports/bank-payment.port';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Chave de encriptação deve vir de variável de ambiente
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'gastometria-secure-key-32chars!!';
const IV_LENGTH = 16;
const ALGORITHM = 'aes-256-cbc';

export class MongoBankPaymentRepository implements IBankPaymentRepository {
  private contactsCollection;
  private devicesCollection;
  private paymentRequestsCollection;
  private pushConfigCollection;

  constructor(private db: Db) {
    this.contactsCollection = db.collection('payment_contacts');
    this.devicesCollection = db.collection('user_devices');
    this.paymentRequestsCollection = db.collection('payment_requests');
    this.pushConfigCollection = db.collection('push_configs');

    // Criar índices
    this.createIndexes();
  }

  private async createIndexes() {
    // Contatos
    await this.contactsCollection.createIndex({ userId: 1 });
    await this.contactsCollection.createIndex({ userId: 1, isFavorite: 1 });
    await this.contactsCollection.createIndex({ userId: 1, name: 'text', nickname: 'text' });

    // Dispositivos
    await this.devicesCollection.createIndex({ userId: 1 });
    await this.devicesCollection.createIndex({ userId: 1, deviceId: 1 }, { unique: true });
    await this.devicesCollection.createIndex({ userId: 1, isPrimary: 1 });

    // Payment Requests
    await this.paymentRequestsCollection.createIndex({ userId: 1 });
    await this.paymentRequestsCollection.createIndex({ userId: 1, status: 1 });
    await this.paymentRequestsCollection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    // Push Config
    await this.pushConfigCollection.createIndex({ userId: 1 }, { unique: true });
  }

  // Encriptação AES para dados sensíveis
  private async encrypt(text: string): Promise<string> {
    const iv = randomBytes(IV_LENGTH);
    const key = (await scryptAsync(ENCRYPTION_KEY, 'salt', 32)) as Buffer;
    const cipher = createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  private async decrypt(encryptedText: string): Promise<string> {
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = (await scryptAsync(ENCRYPTION_KEY, 'salt', 32)) as Buffer;
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private toContact(doc: any): PaymentContact {
    return {
      ...doc,
      id: doc._id.toString(),
      _id: undefined,
    };
  }

  private toDevice(doc: any): UserDevice {
    return {
      ...doc,
      id: doc._id.toString(),
      _id: undefined,
    };
  }

  private toPaymentRequest(doc: any): PaymentRequest {
    return {
      ...doc,
      id: doc._id.toString(),
      _id: undefined,
      events: (doc.events || []).map((e: any) => ({
        ...e,
        id: e._id?.toString() || e.id,
      })),
    };
  }

  // ==================== CONTATOS ====================

  async createContact(userId: string, data: CreateContactInput): Promise<PaymentContact> {
    const now = new Date().toISOString();

    // Encriptar dados sensíveis
    const encryptedPixKey = await this.encrypt(data.pixKey);
    const encryptedDocument = data.document ? await this.encrypt(data.document) : undefined;

    const contact = {
      userId,
      name: data.name,
      nickname: data.nickname,
      pixKeyType: data.pixKeyType,
      pixKey: encryptedPixKey,
      bank: data.bank,
      bankName: data.bankName,
      agency: data.agency,
      account: data.account,
      document: encryptedDocument,
      notes: data.notes,
      isFavorite: data.isFavorite || false,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    const result = await this.contactsCollection.insertOne(contact);

    return {
      ...contact,
      id: result.insertedId.toString(),
      pixKey: data.pixKey, // Retornar descriptografado
      document: data.document,
    };
  }

  async findContactById(id: string): Promise<PaymentContact | null> {
    try {
      const doc = await this.contactsCollection.findOne({ _id: new ObjectId(id) });
      if (!doc) return null;

      const contact = this.toContact(doc);
      // Descriptografar dados sensíveis
      contact.pixKey = await this.decrypt(contact.pixKey);
      if (contact.document) {
        contact.document = await this.decrypt(contact.document);
      }
      return contact;
    } catch {
      return null;
    }
  }

  async findContactsByUserId(userId: string): Promise<PaymentContact[]> {
    const docs = await this.contactsCollection
      .find({ userId })
      .sort({ isFavorite: -1, usageCount: -1, name: 1 })
      .toArray();

    return Promise.all(
      docs.map(async (doc) => {
        const contact = this.toContact(doc);
        contact.pixKey = await this.decrypt(contact.pixKey);
        if (contact.document) {
          contact.document = await this.decrypt(contact.document);
        }
        return contact;
      })
    );
  }

  async findFavoriteContacts(userId: string): Promise<PaymentContact[]> {
    const docs = await this.contactsCollection
      .find({ userId, isFavorite: true })
      .sort({ usageCount: -1, name: 1 })
      .toArray();

    return Promise.all(
      docs.map(async (doc) => {
        const contact = this.toContact(doc);
        contact.pixKey = await this.decrypt(contact.pixKey);
        if (contact.document) {
          contact.document = await this.decrypt(contact.document);
        }
        return contact;
      })
    );
  }

  async updateContact(id: string, data: UpdateContactInput): Promise<PaymentContact | null> {
    try {
      const updateData: any = { ...data, updatedAt: new Date().toISOString() };

      // Encriptar novos dados sensíveis
      if (data.pixKey) {
        updateData.pixKey = await this.encrypt(data.pixKey);
      }
      if (data.document) {
        updateData.document = await this.encrypt(data.document);
      }

      const result = await this.contactsCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (!result) return null;

      const contact = this.toContact(result);
      contact.pixKey = await this.decrypt(contact.pixKey);
      if (contact.document) {
        contact.document = await this.decrypt(contact.document);
      }
      return contact;
    } catch {
      return null;
    }
  }

  async deleteContact(id: string): Promise<boolean> {
    try {
      const result = await this.contactsCollection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch {
      return false;
    }
  }

  async incrementContactUsage(id: string): Promise<void> {
    try {
      await this.contactsCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $inc: { usageCount: 1 },
          $set: { lastUsedAt: new Date().toISOString() },
        }
      );
    } catch {
      // Ignorar erro
    }
  }

  async searchContacts(userId: string, query: string): Promise<PaymentContact[]> {
    const docs = await this.contactsCollection
      .find({
        userId,
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { nickname: { $regex: query, $options: 'i' } },
        ],
      })
      .sort({ usageCount: -1 })
      .limit(10)
      .toArray();

    return Promise.all(
      docs.map(async (doc) => {
        const contact = this.toContact(doc);
        contact.pixKey = await this.decrypt(contact.pixKey);
        if (contact.document) {
          contact.document = await this.decrypt(contact.document);
        }
        return contact;
      })
    );
  }

  // ==================== DISPOSITIVOS ====================

  async registerDevice(userId: string, data: RegisterDeviceInput): Promise<UserDevice> {
    const now = new Date().toISOString();

    // Verificar se já existe
    const existing = await this.devicesCollection.findOne({
      userId,
      deviceId: data.deviceId,
    });

    if (existing) {
      // Atualizar dispositivo existente
      const result = await this.devicesCollection.findOneAndUpdate(
        { _id: existing._id },
        {
          $set: {
            name: data.name,
            type: data.type,
            platform: data.platform,
            userAgent: data.userAgent,
            pushToken: data.pushSubscription?.endpoint,
            pushEndpoint: data.pushSubscription?.endpoint,
            pushP256dh: data.pushSubscription?.keys.p256dh,
            pushAuth: data.pushSubscription?.keys.auth,
            isActive: true,
            lastActiveAt: now,
            updatedAt: now,
          },
        },
        { returnDocument: 'after' }
      );
      return this.toDevice(result);
    }

    // Verificar se é o primeiro dispositivo (será o primário)
    const deviceCount = await this.devicesCollection.countDocuments({ userId });
    const isPrimary = deviceCount === 0;

    const device = {
      userId,
      deviceId: data.deviceId,
      name: data.name,
      type: data.type,
      platform: data.platform,
      userAgent: data.userAgent,
      pushToken: data.pushSubscription?.endpoint,
      pushEndpoint: data.pushSubscription?.endpoint,
      pushP256dh: data.pushSubscription?.keys.p256dh,
      pushAuth: data.pushSubscription?.keys.auth,
      isPrimary,
      isActive: true,
      lastActiveAt: now,
      createdAt: now,
      updatedAt: now,
    };

    const result = await this.devicesCollection.insertOne(device);
    return { ...device, id: result.insertedId.toString() };
  }

  async findDeviceById(id: string): Promise<UserDevice | null> {
    try {
      const doc = await this.devicesCollection.findOne({ _id: new ObjectId(id) });
      return doc ? this.toDevice(doc) : null;
    } catch {
      return null;
    }
  }

  async findDeviceByDeviceId(userId: string, deviceId: string): Promise<UserDevice | null> {
    const doc = await this.devicesCollection.findOne({ userId, deviceId });
    return doc ? this.toDevice(doc) : null;
  }

  async findDevicesByUserId(userId: string): Promise<UserDevice[]> {
    const docs = await this.devicesCollection
      .find({ userId })
      .sort({ isPrimary: -1, lastActiveAt: -1 })
      .toArray();
    return docs.map(this.toDevice);
  }

  async findPrimaryDevice(userId: string): Promise<UserDevice | null> {
    const doc = await this.devicesCollection.findOne({
      userId,
      isPrimary: true,
      isActive: true,
    });
    return doc ? this.toDevice(doc) : null;
  }

  async updateDevice(id: string, data: Partial<UserDevice>): Promise<UserDevice | null> {
    try {
      const result = await this.devicesCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...data, updatedAt: new Date().toISOString() } },
        { returnDocument: 'after' }
      );
      return result ? this.toDevice(result) : null;
    } catch {
      return null;
    }
  }

  async setPrimaryDevice(userId: string, deviceId: string): Promise<boolean> {
    try {
      // Remover primary de todos os outros
      await this.devicesCollection.updateMany(
        { userId, isPrimary: true },
        { $set: { isPrimary: false } }
      );

      // Definir novo primary
      const result = await this.devicesCollection.updateOne(
        { userId, deviceId },
        { $set: { isPrimary: true } }
      );

      return result.modifiedCount > 0;
    } catch {
      return false;
    }
  }

  async removeDevice(id: string): Promise<boolean> {
    try {
      const result = await this.devicesCollection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch {
      return false;
    }
  }

  async updateDeviceActivity(id: string): Promise<void> {
    try {
      await this.devicesCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { lastActiveAt: new Date().toISOString() } }
      );
    } catch {
      // Ignorar erro
    }
  }

  // ==================== PAYMENT REQUESTS ====================

  async createPaymentRequest(userId: string, data: RequestPaymentInput): Promise<PaymentRequest> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutos

    const request = {
      userId,
      paymentData: data.paymentData,
      preferredBank: data.preferredBank,
      status: 'pending' as PaymentRequestStatus,
      originDevice: data.originDevice,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      events: [
        {
          _id: new ObjectId(),
          type: 'created',
          timestamp: now.toISOString(),
        },
      ],
    };

    const result = await this.paymentRequestsCollection.insertOne(request);
    const insertedId = result.insertedId.toString();
    return {
      ...request,
      id: insertedId,
      events: request.events.map(e => ({
        id: (e as any)._id.toString(),
        paymentRequestId: insertedId,
        type: e.type as PaymentEvent['type'],
        timestamp: e.timestamp,
      }))
    };
  }

  async findPaymentRequestById(id: string): Promise<PaymentRequest | null> {
    try {
      const doc = await this.paymentRequestsCollection.findOne({ _id: new ObjectId(id) });
      return doc ? this.toPaymentRequest(doc) : null;
    } catch {
      return null;
    }
  }

  async findPaymentRequestsByUserId(userId: string, limit = 50): Promise<PaymentRequest[]> {
    const docs = await this.paymentRequestsCollection
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    return docs.map(this.toPaymentRequest);
  }

  async findPendingPaymentRequests(userId: string): Promise<PaymentRequest[]> {
    const docs = await this.paymentRequestsCollection
      .find({
        userId,
        status: { $in: ['pending', 'sent', 'opened'] },
        expiresAt: { $gt: new Date().toISOString() },
      })
      .sort({ createdAt: -1 })
      .toArray();
    return docs.map(this.toPaymentRequest);
  }

  async updatePaymentRequestStatus(id: string, status: PaymentRequestStatus): Promise<PaymentRequest | null> {
    try {
      const statusTimestamp: Record<string, string> = {};
      const now = new Date().toISOString();

      switch (status) {
        case 'sent':
          statusTimestamp.sentAt = now;
          break;
        case 'opened':
          statusTimestamp.openedAt = now;
          break;
        case 'redirected':
          statusTimestamp.redirectedAt = now;
          break;
        case 'completed':
          statusTimestamp.completedAt = now;
          break;
      }

      const result = await this.paymentRequestsCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { status, ...statusTimestamp } },
        { returnDocument: 'after' }
      );

      return result ? this.toPaymentRequest(result) : null;
    } catch {
      return null;
    }
  }

  async addPaymentEvent(requestId: string, event: Omit<PaymentEvent, 'id' | 'paymentRequestId'>): Promise<void> {
    try {
      await this.paymentRequestsCollection.updateOne(
        { _id: new ObjectId(requestId) },
        {
          $push: {
            events: {
              _id: new ObjectId(),
              ...event,
            },
          } as any,
        }
      );
    } catch {
      // Ignorar erro
    }
  }

  async expireOldPaymentRequests(): Promise<number> {
    const result = await this.paymentRequestsCollection.updateMany(
      {
        status: { $in: ['pending', 'sent', 'opened'] },
        expiresAt: { $lt: new Date().toISOString() },
      },
      {
        $set: { status: 'expired' },
        $push: {
          events: {
            _id: new ObjectId(),
            type: 'expired',
            timestamp: new Date().toISOString(),
          },
        } as any,
      }
    );
    return result.modifiedCount;
  }

  // ==================== PUSH CONFIG ====================

  async getPushConfig(userId: string): Promise<PushConfig | null> {
    const doc = await this.pushConfigCollection.findOne({ userId });
    if (!doc) return null;
    return {
      userId: doc.userId,
      enabled: doc.enabled,
      primaryDeviceId: doc.primaryDeviceId,
      notifyOnPaymentRequest: doc.notifyOnPaymentRequest ?? true,
      notifyOnPaymentDue: doc.notifyOnPaymentDue ?? true,
      notifyOnPaymentOverdue: doc.notifyOnPaymentOverdue ?? true,
      quietHoursStart: doc.quietHoursStart,
      quietHoursEnd: doc.quietHoursEnd,
    };
  }

  async updatePushConfig(userId: string, config: Partial<PushConfig>): Promise<PushConfig> {
    const result = await this.pushConfigCollection.findOneAndUpdate(
      { userId },
      {
        $set: { ...config, updatedAt: new Date().toISOString() },
        $setOnInsert: { createdAt: new Date().toISOString() },
      },
      { upsert: true, returnDocument: 'after' }
    );

    return {
      userId,
      enabled: result?.enabled ?? true,
      primaryDeviceId: result?.primaryDeviceId,
      notifyOnPaymentRequest: result?.notifyOnPaymentRequest ?? true,
      notifyOnPaymentDue: result?.notifyOnPaymentDue ?? true,
      notifyOnPaymentOverdue: result?.notifyOnPaymentOverdue ?? true,
      quietHoursStart: result?.quietHoursStart,
      quietHoursEnd: result?.quietHoursEnd,
    };
  }
}
