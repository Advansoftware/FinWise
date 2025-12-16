// src/services/pluggy/pluggy.service.ts

/**
 * Pluggy Service
 * High-level service methods for Pluggy API operations
 */

import { PluggyClient, getPluggyClient } from './pluggy.client';
import {
  PluggyItem,
  PluggyAccount,
  PluggyTransaction,
  PluggyTransactionListResponse,
  PluggyIdentity,
  PluggyInvestment,
  PluggyConnector,
  PluggyPaymentCustomer,
  PluggyCreatePaymentCustomerRequest,
  PluggyPaymentRecipient,
  PluggyCreatePaymentRecipientRequest,
  PluggyPaymentRequest,
  PluggyCreatePaymentRequestRequest,
  PluggyPaymentIntent,
  PluggyPaginatedResponse,
  PluggyConnectTokenRequest,
  PluggySmartTransferPreauthorization,
  PluggyCreateSmartTransferPreauthorizationRequest,
  PluggySmartTransferPayment,
  PluggyCreateSmartTransferPaymentRequest,
} from './pluggy.types';

/**
 * PluggyService class providing high-level operations
 */
export class PluggyService {
  private client: PluggyClient;

  constructor(client?: PluggyClient) {
    this.client = client || getPluggyClient();
  }

  // ==================== CONNECT TOKEN ====================

  /**
   * Create a Connect Token for the Pluggy Connect widget
   * @param options Optional configuration for the connect token
   */
  async createConnectToken(options?: PluggyConnectTokenRequest): Promise<string> {
    return this.client.createConnectToken(options);
  }

  // ==================== CONNECTORS ====================

  /**
   * List available connectors (financial institutions)
   * @param sandbox Include sandbox connectors for testing
   */
  async listConnectors(sandbox: boolean = false): Promise<PluggyConnector[]> {
    const params: Record<string, string> = {};
    if (sandbox) {
      params.sandbox = 'true';
    }
    const response = await this.client.get<PluggyPaginatedResponse<PluggyConnector>>(
      '/connectors',
      params
    );
    return response.results;
  }

  /**
   * Get a specific connector by ID
   */
  async getConnector(connectorId: number): Promise<PluggyConnector> {
    return this.client.get<PluggyConnector>(`/connectors/${connectorId}`);
  }

  // ==================== ITEMS ====================

  /**
   * Get an item (bank connection) by ID
   */
  async getItem(itemId: string): Promise<PluggyItem> {
    return this.client.get<PluggyItem>(`/items/${itemId}`);
  }

  /**
   * Update an item to trigger a new sync
   */
  async updateItem(itemId: string): Promise<PluggyItem> {
    return this.client.patch<PluggyItem>(`/items/${itemId}`, {});
  }

  /**
   * Delete an item (disconnect bank)
   */
  async deleteItem(itemId: string): Promise<void> {
    await this.client.delete(`/items/${itemId}`);
  }

  /**
   * Send MFA response for an item
   */
  async sendMFA(itemId: string, parameters: Record<string, string>): Promise<PluggyItem> {
    return this.client.post<PluggyItem>(`/items/${itemId}/mfa`, { parameters });
  }

  // ==================== ACCOUNTS ====================

  /**
   * List accounts for an item
   */
  async listAccounts(itemId: string): Promise<PluggyAccount[]> {
    const response = await this.client.get<PluggyPaginatedResponse<PluggyAccount>>(
      '/accounts',
      { itemId }
    );
    return response.results;
  }

  /**
   * Get a specific account by ID
   */
  async getAccount(accountId: string): Promise<PluggyAccount> {
    return this.client.get<PluggyAccount>(`/accounts/${accountId}`);
  }

  // ==================== TRANSACTIONS ====================

  /**
   * List transactions for an account
   * @param accountId Account ID
   * @param options Filtering options
   */
  async listTransactions(
    accountId: string,
    options?: {
      from?: string; // ISO date
      to?: string; // ISO date
      pageSize?: number;
      page?: number;
    }
  ): Promise<PluggyTransactionListResponse> {
    const params: Record<string, string> = { accountId };

    if (options?.from) params.from = options.from;
    if (options?.to) params.to = options.to;
    if (options?.pageSize) params.pageSize = options.pageSize.toString();
    if (options?.page) params.page = options.page.toString();

    return this.client.get<PluggyTransactionListResponse>('/transactions', params);
  }

  /**
   * Get a specific transaction by ID
   */
  async getTransaction(transactionId: string): Promise<PluggyTransaction> {
    return this.client.get<PluggyTransaction>(`/transactions/${transactionId}`);
  }

  // ==================== IDENTITY ====================

  /**
   * Get identity information for an item
   */
  async getIdentity(itemId: string): Promise<PluggyIdentity> {
    return this.client.get<PluggyIdentity>(`/identity?itemId=${itemId}`);
  }

  // ==================== INVESTMENTS ====================

  /**
   * List investments for an item
   */
  async listInvestments(itemId: string): Promise<PluggyInvestment[]> {
    const response = await this.client.get<PluggyPaginatedResponse<PluggyInvestment>>(
      '/investments',
      { itemId }
    );
    return response.results;
  }

  /**
   * Get a specific investment by ID
   */
  async getInvestment(investmentId: string): Promise<PluggyInvestment> {
    return this.client.get<PluggyInvestment>(`/investments/${investmentId}`);
  }

  // ==================== PAYMENT CUSTOMERS ====================

  /**
   * List payment customers
   */
  async listPaymentCustomers(): Promise<PluggyPaymentCustomer[]> {
    const response = await this.client.get<PluggyPaginatedResponse<PluggyPaymentCustomer>>(
      '/payments/customers'
    );
    return response.results;
  }

  /**
   * Create a payment customer
   */
  async createPaymentCustomer(
    data: PluggyCreatePaymentCustomerRequest
  ): Promise<PluggyPaymentCustomer> {
    return this.client.post<PluggyPaymentCustomer>('/payments/customers', data);
  }

  /**
   * Get a payment customer by ID
   */
  async getPaymentCustomer(customerId: string): Promise<PluggyPaymentCustomer> {
    return this.client.get<PluggyPaymentCustomer>(`/payments/customers/${customerId}`);
  }

  /**
   * Delete a payment customer
   */
  async deletePaymentCustomer(customerId: string): Promise<void> {
    await this.client.delete(`/payments/customers/${customerId}`);
  }

  // ==================== PAYMENT RECIPIENTS ====================

  /**
   * List payment recipients
   */
  async listPaymentRecipients(): Promise<PluggyPaymentRecipient[]> {
    const response = await this.client.get<PluggyPaginatedResponse<PluggyPaymentRecipient>>(
      '/payments/recipients'
    );
    return response.results;
  }

  /**
   * Create a payment recipient
   */
  async createPaymentRecipient(
    data: PluggyCreatePaymentRecipientRequest
  ): Promise<PluggyPaymentRecipient> {
    return this.client.post<PluggyPaymentRecipient>('/payments/recipients', data);
  }

  /**
   * Get a payment recipient by ID
   */
  async getPaymentRecipient(recipientId: string): Promise<PluggyPaymentRecipient> {
    return this.client.get<PluggyPaymentRecipient>(`/payments/recipients/${recipientId}`);
  }

  /**
   * Update a payment recipient
   */
  async updatePaymentRecipient(
    recipientId: string,
    data: Partial<PluggyCreatePaymentRecipientRequest>
  ): Promise<PluggyPaymentRecipient> {
    return this.client.patch<PluggyPaymentRecipient>(
      `/payments/recipients/${recipientId}`,
      data
    );
  }

  /**
   * Delete a payment recipient
   */
  async deletePaymentRecipient(recipientId: string): Promise<void> {
    await this.client.delete(`/payments/recipients/${recipientId}`);
  }

  /**
   * Create a payment recipient from a PIX key
   * This uses the DICT lookup to get recipient info from the PIX key
   */
  async createPaymentRecipientFromPixKey(
    pixKey: string,
    name?: string
  ): Promise<PluggyPaymentRecipient> {
    return this.client.post<PluggyPaymentRecipient>('/payments/recipients/pix-key', {
      pixKey,
      name,
    });
  }

  /**
   * Create a payment recipient from a PIX QR code
   */
  async createPaymentRecipientFromPixQr(
    pixQrCode: string
  ): Promise<PluggyPaymentRecipient> {
    return this.client.post<PluggyPaymentRecipient>('/payments/recipients/pix-qr', {
      pixQrCode,
    });
  }

  // ==================== PAYMENT REQUESTS ====================

  /**
   * List payment requests
   */
  async listPaymentRequests(): Promise<PluggyPaymentRequest[]> {
    const response = await this.client.get<PluggyPaginatedResponse<PluggyPaymentRequest>>(
      '/payments/requests'
    );
    return response.results;
  }

  /**
   * Create a payment request (PIX payment initiation)
   */
  async createPaymentRequest(
    data: PluggyCreatePaymentRequestRequest
  ): Promise<PluggyPaymentRequest> {
    return this.client.post<PluggyPaymentRequest>('/payments/requests', data);
  }

  /**
   * Get a payment request by ID
   */
  async getPaymentRequest(requestId: string): Promise<PluggyPaymentRequest> {
    return this.client.get<PluggyPaymentRequest>(`/payments/requests/${requestId}`);
  }

  /**
   * Delete a payment request
   */
  async deletePaymentRequest(requestId: string): Promise<void> {
    await this.client.delete(`/payments/requests/${requestId}`);
  }

  // ==================== PAYMENT INTENTS ====================

  /**
   * List payment intents for a payment request
   */
  async listPaymentIntents(paymentRequestId: string): Promise<PluggyPaymentIntent[]> {
    const response = await this.client.get<PluggyPaginatedResponse<PluggyPaymentIntent>>(
      '/payments/intents',
      { paymentRequestId }
    );
    return response.results;
  }

  /**
   * Get a payment intent by ID
   */
  async getPaymentIntent(intentId: string): Promise<PluggyPaymentIntent> {
    return this.client.get<PluggyPaymentIntent>(`/payments/intents/${intentId}`);
  }

  /**
   * Create a payment intent (initiate the payment flow)
   */
  async createPaymentIntent(paymentRequestId: string): Promise<PluggyPaymentIntent> {
    return this.client.post<PluggyPaymentIntent>('/payments/intents', {
      paymentRequestId,
    });
  }

  // ==================== SMART TRANSFERS ====================

  /**
   * List smart transfer preauthorizations
   */
  async listSmartTransferPreauthorizations(): Promise<PluggySmartTransferPreauthorization[]> {
    const response = await this.client.get<PluggyPaginatedResponse<PluggySmartTransferPreauthorization>>(
      '/smart-transfers/preauthorizations'
    );
    return response.results;
  }

  /**
   * Create a smart transfer preauthorization
   * User will need to authorize via consentUrl
   */
  async createSmartTransferPreauthorization(
    data: PluggyCreateSmartTransferPreauthorizationRequest
  ): Promise<PluggySmartTransferPreauthorization> {
    return this.client.post<PluggySmartTransferPreauthorization>(
      '/smart-transfers/preauthorizations',
      data
    );
  }

  /**
   * Get a smart transfer preauthorization by ID
   */
  async getSmartTransferPreauthorization(
    preauthorizationId: string
  ): Promise<PluggySmartTransferPreauthorization> {
    return this.client.get<PluggySmartTransferPreauthorization>(
      `/smart-transfers/preauthorizations/${preauthorizationId}`
    );
  }

  /**
   * Create a smart transfer payment (automatic, no user interaction needed)
   * Requires an active/completed preauthorization
   */
  async createSmartTransferPayment(
    data: PluggyCreateSmartTransferPaymentRequest
  ): Promise<PluggySmartTransferPayment> {
    return this.client.post<PluggySmartTransferPayment>(
      '/smart-transfers/payments',
      data
    );
  }

  /**
   * Get a smart transfer payment by ID
   */
  async getSmartTransferPayment(paymentId: string): Promise<PluggySmartTransferPayment> {
    return this.client.get<PluggySmartTransferPayment>(
      `/smart-transfers/payments/${paymentId}`
    );
  }
}

// ==================== SINGLETON ====================

let defaultService: PluggyService | null = null;

export function getPluggyService(): PluggyService {
  if (!defaultService) {
    defaultService = new PluggyService();
  }
  return defaultService;
}

export function resetPluggyService(): void {
  defaultService = null;
}
