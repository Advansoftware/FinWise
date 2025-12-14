
// src/lib/api-client.ts

// Helper to safely parse JSON response
async function safeJsonParse(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    // Response is not JSON (possibly HTML error page)
    const text = await response.text();
    throw new Error(`Expected JSON response but got ${contentType || 'unknown'}: ${text.substring(0, 100)}`);
  }
  return response.json();
}

// API client for interacting with our data API
export class ApiClient {
  private getBaseUrl() {
    // Check if running on server (Docker/Node.js) vs client (browser)
    if (typeof window === 'undefined') {
      // Server-side: use absolute URL
      return process.env.NEXT_PUBLIC_APP_URL || 'https://gastometria.com.br';
    }
    // Client-side: use relative URL
    return '';
  }

  private get baseUrl() {
    return `${this.getBaseUrl()}/api/data`;
  }

  private get transactionsUrl() {
    return `${this.getBaseUrl()}/api/transactions`;
  }

  async get(collection: string, userId: string, id?: string) {
    // Use specific API for transactions
    if (collection === 'transactions') {
      return this.getTransactions(userId, id);
    }

    // Rota para buscar filhos de uma transação
    if (collection.startsWith('transactions/') && collection.endsWith('/children')) {
      const parentId = collection.replace('transactions/', '').replace('/children', '');
      return this.getTransactionChildren(userId, parentId);
    }

    const params = new URLSearchParams({
      collection,
      userId,
      ...(id && { id })
    });

    const response = await fetch(`${this.baseUrl}?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${collection}: ${response.statusText}`);
    }
    return safeJsonParse(response);
  }

  private async getTransactions(userId: string, id?: string) {
    const params = new URLSearchParams({ userId });
    const url = id ? `${this.transactionsUrl}/${id}?${params}` : `${this.transactionsUrl}?${params}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.statusText}`);
    }
    return safeJsonParse(response);
  }

  private async getTransactionChildren(userId: string, parentId: string) {
    const params = new URLSearchParams({ userId });
    const response = await fetch(`${this.transactionsUrl}/${parentId}/children?${params}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch transaction children: ${response.statusText}`);
    }
    return safeJsonParse(response);
  }

  async create(collection: string, data: any) {
    // Use specific API for grouped transactions
    if (collection === 'transactions/grouped') {
      return this.createGroupedTransaction(data);
    }

    // Use specific API for child transactions
    if (collection.startsWith('transactions/') && collection.endsWith('/children')) {
      const parentId = collection.replace('transactions/', '').replace('/children', '');
      return this.createChildTransaction(parentId, data);
    }

    // Use specific API for transactions
    if (collection === 'transactions') {
      return this.createTransaction(data);
    }

    // Remove temporary ID before sending to server
    const { id, ...dataWithoutTempId } = data;

    const params = new URLSearchParams({ collection });
    const response = await fetch(`${this.baseUrl}?${params}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataWithoutTempId),
    });

    if (!response.ok) {
      throw new Error(`Failed to create ${collection}: ${response.statusText}`);
    }
    return safeJsonParse(response);
  }

  private async createTransaction(data: any) {
    // Remove temporary ID before sending to server
    const { id, ...dataWithoutTempId } = data;

    const params = new URLSearchParams({ userId: data.userId });
    const response = await fetch(`${this.transactionsUrl}?${params}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataWithoutTempId),
    });

    if (!response.ok) {
      throw new Error(`Failed to create transaction: ${response.statusText}`);
    }
    return safeJsonParse(response);
  }

  private async createGroupedTransaction(data: any) {
    const { parent, children } = data;
    const userId = parent.userId;

    const params = new URLSearchParams({ userId });
    const response = await fetch(`${this.transactionsUrl}/grouped?${params}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ parent, children }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create grouped transaction: ${response.statusText}`);
    }
    return safeJsonParse(response);
  }

  private async createChildTransaction(parentId: string, data: any) {
    const { id, ...dataWithoutTempId } = data;
    const userId = data.userId;

    const params = new URLSearchParams({ userId });
    const response = await fetch(`${this.transactionsUrl}/${parentId}/children?${params}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataWithoutTempId),
    });

    if (!response.ok) {
      throw new Error(`Failed to create child transaction: ${response.statusText}`);
    }
    return safeJsonParse(response);
  }

  async update(collection: string, id: string, data: any) {
    // Use specific API for child transactions
    if (collection.startsWith('transactions/') && collection.endsWith('/children')) {
      const parentId = collection.replace('transactions/', '').replace('/children', '');
      return this.updateChildTransaction(parentId, id, data);
    }

    // Use specific API for transactions
    if (collection === 'transactions') {
      return this.updateTransaction(id, data);
    }

    const params = new URLSearchParams({ collection, id });
    const response = await fetch(`${this.baseUrl}?${params}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update ${collection}: ${response.statusText}`);
    }
    return safeJsonParse(response);
  }

  private async updateTransaction(id: string, data: any) {
    // Extract userId from data for authentication
    const userId = data.originalTransaction?.userId || data.updates?.userId;
    if (!userId) {
      throw new Error('User ID is required for transaction update');
    }

    const params = new URLSearchParams({ userId });
    const response = await fetch(`${this.transactionsUrl}/${id}?${params}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update transaction: ${response.statusText}`);
    }
    return safeJsonParse(response);
  }

  private async updateChildTransaction(parentId: string, childId: string, data: any) {
    const userId = data.userId;
    if (!userId) {
      throw new Error('User ID is required for child transaction update');
    }

    const params = new URLSearchParams({ userId });
    const response = await fetch(`${this.transactionsUrl}/${parentId}/children?${params}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...data, childId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update child transaction: ${response.statusText}`);
    }
    return safeJsonParse(response);
  }

  async delete(collection: string, id: string, data?: any) {
    // Use specific API for child transactions
    if (collection.startsWith('transactions/') && collection.endsWith('/children')) {
      const parentId = collection.replace('transactions/', '').replace('/children', '');
      return this.deleteChildTransaction(parentId, id, data);
    }

    // Use specific API for transactions
    if (collection === 'transactions') {
      return this.deleteTransaction(id, data);
    }

    const params = new URLSearchParams({ collection, id });
    const response = await fetch(`${this.baseUrl}?${params}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      // Include data in the body for delete operations if provided
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Failed to delete ${collection}: ${response.statusText}`);
    }
    return safeJsonParse(response);
  }

  private async deleteTransaction(id: string, data?: any) {
    const userId = data?.userId;
    if (!userId) {
      throw new Error('User ID is required for transaction deletion');
    }

    const params = new URLSearchParams({ userId });
    const response = await fetch(`${this.transactionsUrl}/${id}?${params}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete transaction: ${response.statusText}`);
    }
    return safeJsonParse(response);
  }

  private async deleteChildTransaction(parentId: string, childId: string, data?: any) {
    const userId = data?.userId;
    if (!userId) {
      throw new Error('User ID is required for child transaction deletion');
    }

    const params = new URLSearchParams({ userId });
    const response = await fetch(`${this.transactionsUrl}/${parentId}/children?${params}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ childId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete child transaction: ${response.statusText}`);
    }
    // 204 No Content doesn't return JSON
    if (response.status === 204) {
      return { success: true };
    }
    return safeJsonParse(response);
  }
}

export const apiClient = new ApiClient();
