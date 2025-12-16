// src/services/pluggy/pluggy.types.ts

/**
 * Pluggy API Type Definitions
 * @see https://pluggy.readme.io/reference/
 */

// ==================== AUTH ====================

export interface PluggyAuthRequest {
  clientId: string;
  clientSecret: string;
}

export interface PluggyAuthResponse {
  apiKey: string;
}

export interface PluggyConnectTokenRequest {
  itemId?: string;
  options?: {
    clientUserId?: string;
    webhookUrl?: string;
    updateItem?: boolean;
  };
}

export interface PluggyConnectTokenResponse {
  accessToken: string;
}

// ==================== CONNECTORS ====================

export interface PluggyConnector {
  id: number;
  name: string;
  institutionUrl: string;
  imageUrl: string;
  primaryColor: string;
  type: 'PERSONAL_BANK' | 'BUSINESS_BANK' | 'INVESTMENT' | 'INVOICE' | 'OTHER';
  country: string;
  credentials: PluggyConnectorCredential[];
  hasMFA: boolean;
  products: string[];
  oauth: boolean;
  oauthUrl?: string;
  isOpenFinance: boolean;
  isSandbox: boolean;
  supportsPaymentInitiation: boolean;
}

export interface PluggyConnectorCredential {
  label: string;
  name: string;
  type: 'text' | 'password' | 'number';
  placeholder?: string;
  validation?: string;
  validationMessage?: string;
  optional?: boolean;
}

// ==================== ITEMS ====================

export type PluggyItemStatus =
  | 'UPDATING'
  | 'LOGIN_ERROR'
  | 'WAITING_USER_INPUT'
  | 'WAITING_USER_ACTION'
  | 'OUTDATED'
  | 'UPDATED';

export interface PluggyItem {
  id: string;
  connector: PluggyConnector;
  status: PluggyItemStatus;
  statusDetail?: {
    stage: string;
    stageName: string;
    stageStatus: string;
  };
  error?: {
    code: string;
    message: string;
  };
  executionStatus: string;
  lastUpdatedAt?: string;
  createdAt: string;
  updatedAt: string;
  clientUserId?: string;
  webhookUrl?: string;
  parameter?: Record<string, any>;
  userAction?: {
    instructions: string;
    attributes: Array<{
      name: string;
      label: string;
      data?: string;
    }>;
    expiresAt: string;
  };
  consecutiveFailedLoginAttempts: number;
  nextAutoSyncAt?: string;
}

export interface PluggyCreateItemRequest {
  connectorId: number;
  parameters?: Record<string, string>;
  webhookUrl?: string;
  clientUserId?: string;
}

// ==================== ACCOUNTS ====================

export type PluggyAccountType =
  | 'CHECKING_ACCOUNT'
  | 'SAVINGS_ACCOUNT'
  | 'CREDIT_CARD';

export type PluggyAccountSubtype =
  | 'CHECKING_ACCOUNT'
  | 'SAVINGS_ACCOUNT'
  | 'CREDIT_CARD';

export interface PluggyAccount {
  id: string;
  itemId: string;
  type: PluggyAccountType;
  subtype: PluggyAccountSubtype;
  name: string;
  marketingName?: string;
  number: string;
  balance: number;
  currencyCode: string;
  owner?: string;
  bankData?: {
    transferNumber?: string;
    closingBalance?: number;
  };
  creditData?: {
    level?: string;
    brand?: string;
    balanceCloseDate?: string;
    balanceDueDate?: string;
    availableCreditLimit?: number;
    balanceForeignCurrency?: number;
    minimumPayment?: number;
    creditLimit?: number;
  };
  taxNumber?: string;
}

// ==================== TRANSACTIONS ====================

export type PluggyTransactionType = 'DEBIT' | 'CREDIT';

export type PluggyTransactionStatus = 'PENDING' | 'POSTED';

export interface PluggyTransaction {
  id: string;
  accountId: string;
  date: string;
  description: string;
  descriptionRaw?: string;
  currencyCode: string;
  amount: number;
  amountInAccountCurrency?: number;
  type: PluggyTransactionType;
  balance?: number;
  category?: string;
  categoryId?: string;
  providerCode?: string;
  status: PluggyTransactionStatus;
  paymentData?: {
    payer?: {
      name?: string;
      branchNumber?: string;
      accountNumber?: string;
      routingNumber?: string;
      documentNumber?: {
        type: string;
        value: string;
      };
    };
    receiver?: {
      name?: string;
      branchNumber?: string;
      accountNumber?: string;
      routingNumber?: string;
      documentNumber?: {
        type: string;
        value: string;
      };
    };
    paymentMethod?: string;
    referenceNumber?: string;
    reason?: string;
  };
  creditCardMetadata?: {
    installmentNumber?: number;
    totalInstallments?: number;
    totalAmount?: number;
    purchaseDate?: string;
    payeeMCC?: number;
  };
  merchant?: {
    name: string;
    businessName?: string;
    cnpj?: string;
    category?: string;
  };
}

export interface PluggyTransactionListResponse {
  total: number;
  totalPages: number;
  page: number;
  results: PluggyTransaction[];
}

// ==================== IDENTITY ====================

export interface PluggyIdentity {
  id: string;
  itemId: string;
  birthDate?: string;
  taxNumber?: string;
  document?: string;
  documentType?: string;
  jobTitle?: string;
  companyName?: string;
  fullName?: string;
  emails?: Array<{
    type: string;
    value: string;
  }>;
  phoneNumbers?: Array<{
    type: string;
    value: string;
  }>;
  addresses?: Array<{
    fullAddress?: string;
    primaryAddress?: string;
    city?: string;
    postalCode?: string;
    state?: string;
    country?: string;
    type?: string;
  }>;
  relations?: Array<{
    type: string;
    name?: string;
    document?: string;
  }>;
}

// ==================== INVESTMENTS ====================

export interface PluggyInvestment {
  id: string;
  itemId: string;
  type: string;
  subtype?: string;
  name: string;
  number?: string;
  balance: number;
  currencyCode: string;
  value?: number;
  quantity?: number;
  annualRate?: number;
  lastTwelveMonthsRate?: number;
  dueDate?: string;
  issuer?: string;
  issuerCnpj?: string;
  isin?: string;
  code?: string;
  amountProfit?: number;
  amountWithdrawal?: number;
  amountOriginal?: number;
  taxes?: Array<{
    type: string;
    value: number;
  }>;
  status: string;
  date?: string;
  owner?: string;
  fixedAnnualRate?: number;
}

// ==================== PAYMENT INITIATION ====================

export interface PluggyPaymentCustomer {
  id: string;
  type: 'INDIVIDUAL' | 'BUSINESS';
  name: string;
  email: string;
  taxNumber: string;
}

export interface PluggyCreatePaymentCustomerRequest {
  type: 'INDIVIDUAL' | 'BUSINESS';
  name: string;
  email: string;
  taxNumber: string;
}

export interface PluggyPaymentRecipient {
  id: string;
  taxNumber: string;
  name: string;
  paymentInstitution: {
    id: string;
    name: string;
    ispb?: string;
  };
  account: {
    branch: string;
    number: string;
    type: 'CHECKING' | 'SAVINGS';
  };
  pixKey?: string;
  isDefault: boolean;
}

export interface PluggyCreatePaymentRecipientRequest {
  taxNumber: string;
  name: string;
  paymentInstitutionId: string;
  account: {
    branch: string;
    number: string;
    type: 'CHECKING' | 'SAVINGS';
  };
  pixKey?: string;
  isDefault?: boolean;
}

export type PluggyPaymentRequestStatus =
  | 'CREATED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'ERROR'
  | 'CANCELLED';

export interface PluggyPaymentRequest {
  id: string;
  amount: number;
  description?: string;
  status: PluggyPaymentRequestStatus;
  paymentUrl: string;
  recipientId: string;
  customerId?: string;
  callbackUrls?: {
    success?: string;
    error?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PluggyCreatePaymentRequestRequest {
  amount: number;
  description?: string;
  recipientId: string;
  customerId?: string;
  callbackUrls?: {
    success?: string;
    error?: string;
  };
}

export type PluggyPaymentIntentStatus =
  | 'STARTED'
  | 'ENQUEUED'
  | 'CONSENT_AWAITING_AUTHORIZATION'
  | 'CONSENT_AUTHORIZED'
  | 'CONSENT_REJECTED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_PARTIALLY_ACCEPTED'
  | 'PAYMENT_SETTLEMENT_PROCESSING'
  | 'PAYMENT_SETTLEMENT_DEBTOR_ACCOUNT'
  | 'PAYMENT_COMPLETED'
  | 'PAYMENT_REVOKED'
  | 'ERROR';

export interface PluggyPaymentIntent {
  id: string;
  paymentRequestId: string;
  status: PluggyPaymentIntentStatus;
  createdAt: string;
  updatedAt: string;
  errorDetail?: {
    code: string;
    message: string;
  };
  consentUrl?: string;
  paymentReceipt?: {
    endToEndId: string;
    completedAt: string;
  };
}

// ==================== WEBHOOKS ====================

export type PluggyWebhookEvent =
  | 'item/created'
  | 'item/updated'
  | 'item/error'
  | 'item/deleted'
  | 'item/waiting_user_input'
  | 'item/waiting_user_action'
  | 'item/login_succeeded'
  | 'transactions/created'
  | 'transactions/updated'
  | 'all'
  | 'payment_intent/created'
  | 'payment_intent/completed'
  | 'payment_intent/error'
  | 'smart_transfer/preauthorization/completed'
  | 'smart_transfer/payment/completed';

// ==================== SMART TRANSFERS ====================

export type PluggySmartTransferPreauthorizationStatus =
  | 'CREATED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'ERROR'
  | 'EXPIRED';

export interface PluggySmartTransferPreauthorization {
  id: string;
  status: PluggySmartTransferPreauthorizationStatus;
  consentUrl?: string;
  clientPreauthorizationId?: string;
  callbackUrls?: {
    success?: string;
    error?: string;
  };
  recipients: PluggyPaymentRecipient[];
  connector: {
    id: number;
    name: string;
    primaryColor: string;
    imageUrl: string;
  };
  configuration?: PluggySmartTransferConfiguration;
  createdAt: string;
  updatedAt: string;
}

export interface PluggySmartTransferConfiguration {
  totalAllowedAmount?: number;
  transactionLimit?: number;
  periodicLimits?: {
    day?: { quantityLimit?: number; transactionLimit?: number };
    week?: { quantityLimit?: number; transactionLimit?: number };
    month?: { quantityLimit?: number; transactionLimit?: number };
    year?: { quantityLimit?: number; transactionLimit?: number };
  };
}

export interface PluggyCreateSmartTransferPreauthorizationRequest {
  connectorId: number;
  parameters: {
    cpf: string;
    cnpj?: string;
  };
  recipientIds: string[];
  callbackUrls?: {
    success?: string;
    error?: string;
  };
  configuration?: PluggySmartTransferConfiguration;
  clientPreauthorizationId?: string;
}

export type PluggySmartTransferPaymentStatus =
  | 'CONSENT_AUTHORIZED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_COMPLETED'
  | 'PAYMENT_REJECTED'
  | 'ERROR';

export interface PluggySmartTransferPayment {
  id: string;
  preauthorizationId: string;
  status: PluggySmartTransferPaymentStatus;
  amount: number;
  description?: string;
  recipient: PluggyPaymentRecipient;
  clientPaymentId?: string;
  createdAt: string;
  updatedAt: string;
  paymentReceipt?: {
    endToEndId: string;
    completedAt: string;
  };
}

export interface PluggyCreateSmartTransferPaymentRequest {
  preauthorizationId: string;
  recipientId: string;
  amount: number;
  description?: string;
  clientPaymentId?: string;
}

export interface PluggyWebhookPayload {
  event: PluggyWebhookEvent;
  id?: string;
  itemId?: string;
  triggeredAt: string;
  data?: Record<string, any>;
}

// ==================== ERROR ====================

export interface PluggyError {
  code: number;
  message: string;
}

// ==================== PAGINATION ====================

export interface PluggyPaginatedResponse<T> {
  total: number;
  totalPages: number;
  page: number;
  results: T[];
}

// ==================== INTERNAL TYPES ====================

export interface PluggyItemWithAccounts extends PluggyItem {
  accounts?: PluggyAccount[];
}

export interface PluggyStoredConnection {
  itemId: string;
  userId: string;
  connectorName: string;
  connectorImageUrl: string;
  status: PluggyItemStatus;
  lastSyncedAt?: string;
  createdAt: string;
}
