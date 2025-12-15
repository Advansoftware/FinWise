// src/core/ports/bank-payment.port.ts

/**
 * Tipos de pagamento suportados
 */
export type PaymentType = 'pix' | 'boleto' | 'transfer';

/**
 * Tipo de chave PIX
 */
export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';

/**
 * Bancos brasileiros suportados
 */
export type SupportedBank =
  | 'nubank'
  | 'itau'
  | 'bradesco'
  | 'santander'
  | 'inter'
  | 'bb'
  | 'caixa'
  | 'c6bank'
  | 'c6' // Alias para c6bank
  | 'picpay'
  | 'mercadopago'
  | 'pagbank'
  | 'neon'
  | 'next'
  | 'original'
  | 'sicoob'
  | 'sicredi'
  | 'banrisul'
  | 'outros';

/**
 * Status de uma solicitação de pagamento
 */
export type PaymentRequestStatus =
  | 'pending'      // Aguardando ação
  | 'sent'         // Push enviado (para fluxo PC)
  | 'opened'       // Usuário abriu a notificação/link
  | 'redirected'   // Redirecionado para o banco
  | 'completed'    // Confirmado como pago
  | 'failed'       // Falhou
  | 'expired'      // Expirou
  | 'cancelled';   // Cancelado

/**
 * Tipo de dispositivo
 */
export type DeviceType = 'mobile' | 'desktop' | 'tablet';

/**
 * Plataforma do dispositivo
 */
export type DevicePlatform = 'android' | 'ios' | 'windows' | 'macos' | 'linux' | 'unknown';

/**
 * Chave PIX individual de um contato
 */
export interface ContactPixKey {
  id: string;
  pixKeyType: PixKeyType;
  pixKey: string; // Encriptado no banco
  bank?: SupportedBank;
  bankName?: string; // Para "outros"
  label?: string; // Ex: "Pessoal", "Trabalho"
  isDefault: boolean;
  createdAt: string;
}

/**
 * Contato/Favorecido para pagamentos
 * Suporta múltiplas chaves PIX por contato
 */
export interface PaymentContact {
  id: string;
  userId: string;
  name: string;
  nickname?: string;
  document?: string; // CPF/CNPJ encriptado
  notes?: string;
  isFavorite: boolean;
  usageCount: number;
  lastUsedAt?: string;
  // Múltiplas chaves PIX
  pixKeys: ContactPixKey[];
  createdAt: string;
  updatedAt: string;

  // @deprecated - Mantido para compatibilidade, usar pixKeys
  pixKeyType?: PixKeyType;
  pixKey?: string;
  bank?: SupportedBank;
  bankName?: string;
  agency?: string;
  account?: string;
}

/**
 * Dispositivo registrado para push
 */
export interface UserDevice {
  id: string;
  userId: string;
  deviceId: string; // UUID único do dispositivo
  name: string;
  type: DeviceType;
  platform: DevicePlatform;
  pushToken?: string; // Token para Web Push
  pushEndpoint?: string;
  pushP256dh?: string;
  pushAuth?: string;
  userAgent: string;
  isPrimary: boolean; // Dispositivo principal para receber pushes
  isActive: boolean;
  lastActiveAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Dados do pagamento para deep link
 */
export interface PaymentData {
  type: PaymentType;
  amount: number;
  description?: string;
  bank?: SupportedBank; // Banco preferido para o pagamento

  // Dados PIX
  pixKey?: string;
  pixKeyType?: PixKeyType;
  receiverName?: string;
  receiverDocument?: string;
  receiverPixKey?: string; // Chave PIX do destinatário

  // Dados Boleto
  barcode?: string;
  dueDate?: string;

  // Referência
  installmentId?: string;
  installmentPaymentId?: string;
  contactId?: string;
}

/**
 * Solicitação de pagamento
 */
export interface PaymentRequest {
  id: string;
  userId: string;

  // Dados do pagamento
  paymentData: PaymentData;
  preferredBank?: SupportedBank;

  // Rastreamento
  status: PaymentRequestStatus;
  originDevice: 'mobile' | 'desktop';
  targetDeviceId?: string; // Dispositivo que deve receber o push

  // Timestamps
  createdAt: string;
  sentAt?: string;
  openedAt?: string;
  redirectedAt?: string;
  completedAt?: string;
  expiresAt: string;

  // Logs
  events: PaymentEvent[];
}

/**
 * Evento de pagamento para histórico
 */
export interface PaymentEvent {
  id: string;
  paymentRequestId: string;
  type: 'created' | 'push_sent' | 'push_received' | 'link_opened' | 'bank_opened' | 'completed' | 'failed' | 'cancelled' | 'expired';
  timestamp: string;
  deviceId?: string;
  metadata?: Record<string, any>;
}

/**
 * Deep link gerado para um banco
 */
export interface BankDeepLink {
  bank: SupportedBank;
  scheme: string;
  url: string;
  fallbackUrl?: string; // URL web caso app não esteja instalado
  androidIntent?: string; // Intent URI para Android
  iosUniversalLink?: string; // Universal Link para iOS
}

/**
 * Configuração de push do usuário
 */
export interface PushConfig {
  userId: string;
  enabled: boolean;
  primaryDeviceId?: string;
  notifyOnPaymentRequest: boolean;
  notifyOnPaymentDue: boolean;
  notifyOnPaymentOverdue: boolean;
  quietHoursStart?: string; // HH:mm
  quietHoursEnd?: string;
}

/**
 * Payload da notificação push
 */
export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data: {
    type: 'payment_request';
    paymentRequestId: string;
    url: string;
  };
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

/**
 * Input para criar/adicionar uma chave PIX
 */
export interface PixKeyInput {
  pixKeyType: PixKeyType;
  pixKey: string;
  bank?: SupportedBank;
  bankName?: string;
  label?: string;
  isDefault?: boolean;
}

/**
 * Input para criar contato
 */
export interface CreateContactInput {
  name: string;
  nickname?: string;
  document?: string;
  notes?: string;
  isFavorite?: boolean;
  // Nova estrutura: múltiplas chaves
  pixKeys?: PixKeyInput[];
  // @deprecated - Compatibilidade: criar com chave única
  pixKeyType?: PixKeyType;
  pixKey?: string;
  bank?: SupportedBank;
  bankName?: string;
}

/**
 * Input para atualizar contato
 */
export interface UpdateContactInput {
  name?: string;
  nickname?: string;
  document?: string;
  notes?: string;
  isFavorite?: boolean;
  // Para atualizar chaves, usar métodos específicos
}

/**
 * Input para registrar dispositivo
 */
export interface RegisterDeviceInput {
  deviceId: string;
  name: string;
  type: DeviceType;
  platform: DevicePlatform;
  userAgent: string;
  pushSubscription?: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
}

/**
 * Input para solicitar pagamento
 */
export interface RequestPaymentInput {
  paymentData: PaymentData;
  preferredBank?: SupportedBank;
  originDevice: 'mobile' | 'desktop';
}

/**
 * Resultado da solicitação de pagamento
 */
export interface PaymentRequestResult {
  paymentRequest: PaymentRequest;
  // Se mobile, retorna deep link direto
  deepLink?: BankDeepLink;
  // Se desktop, retorna info do push enviado
  pushSent?: boolean;
  targetDevice?: {
    id: string;
    name: string;
  };
}

/**
 * Interface do repositório de pagamentos bancários
 */
export interface IBankPaymentRepository {
  // Contatos
  createContact(userId: string, data: CreateContactInput): Promise<PaymentContact>;
  findContactById(id: string): Promise<PaymentContact | null>;
  findContactsByUserId(userId: string): Promise<PaymentContact[]>;
  findFavoriteContacts(userId: string): Promise<PaymentContact[]>;
  updateContact(id: string, data: UpdateContactInput): Promise<PaymentContact | null>;
  deleteContact(id: string): Promise<boolean>;
  incrementContactUsage(id: string): Promise<void>;
  searchContacts(userId: string, query: string): Promise<PaymentContact[]>;

  // Chaves PIX do contato
  addPixKey(contactId: string, data: PixKeyInput): Promise<ContactPixKey>;
  updatePixKey(contactId: string, keyId: string, data: Partial<PixKeyInput>): Promise<ContactPixKey | null>;
  removePixKey(contactId: string, keyId: string): Promise<boolean>;
  setDefaultPixKey(contactId: string, keyId: string): Promise<boolean>;

  // Dispositivos
  registerDevice(userId: string, data: RegisterDeviceInput): Promise<UserDevice>;
  findDeviceById(id: string): Promise<UserDevice | null>;
  findDeviceByDeviceId(userId: string, deviceId: string): Promise<UserDevice | null>;
  findDevicesByUserId(userId: string): Promise<UserDevice[]>;
  findPrimaryDevice(userId: string): Promise<UserDevice | null>;
  updateDevice(id: string, data: Partial<UserDevice>): Promise<UserDevice | null>;
  setPrimaryDevice(userId: string, deviceId: string): Promise<boolean>;
  removeDevice(id: string): Promise<boolean>;
  updateDeviceActivity(id: string): Promise<void>;

  // Solicitações de Pagamento
  createPaymentRequest(userId: string, data: RequestPaymentInput): Promise<PaymentRequest>;
  findPaymentRequestById(id: string): Promise<PaymentRequest | null>;
  findPaymentRequestsByUserId(userId: string, limit?: number): Promise<PaymentRequest[]>;
  findPendingPaymentRequests(userId: string): Promise<PaymentRequest[]>;
  updatePaymentRequestStatus(id: string, status: PaymentRequestStatus): Promise<PaymentRequest | null>;
  addPaymentEvent(requestId: string, event: Omit<PaymentEvent, 'id' | 'paymentRequestId'>): Promise<void>;
  expireOldPaymentRequests(): Promise<number>;

  // Configurações Push
  getPushConfig(userId: string): Promise<PushConfig | null>;
  updatePushConfig(userId: string, config: Partial<PushConfig>): Promise<PushConfig>;
}

/**
 * Interface do serviço de Deep Links
 */
export interface IBankDeepLinkService {
  generateDeepLink(bank: SupportedBank, paymentData: PaymentData): BankDeepLink;
  generateAllDeepLinks(paymentData: PaymentData): BankDeepLink[];
  detectInstalledBanks(): Promise<SupportedBank[]>;
  openBankApp(deepLink: BankDeepLink): Promise<boolean>;
  getBankInfo(bank: SupportedBank): {
    name: string;
    color: string;
    icon: string;
    supportsPixKey: boolean;
    supportsBoleto: boolean;
  };
}

/**
 * Interface do serviço de Push Notifications
 */
export interface IPushNotificationService {
  sendPushNotification(device: UserDevice, payload: PushPayload): Promise<boolean>;
  generateVapidKeys(): { publicKey: string; privateKey: string };
  getPublicKey(): string;
}
