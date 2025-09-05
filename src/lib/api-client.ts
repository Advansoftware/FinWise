// src/lib/api-client.ts

// API client for interacting with our data API
export class ApiClient {
  private baseUrl = '/api/data';

  async get(collection: string, userId: string, id?: string) {
    const params = new URLSearchParams({
      collection,
      userId,
      ...(id && { id })
    });

    const response = await fetch(`${this.baseUrl}?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${collection}: ${response.statusText}`);
    }
    return response.json();
  }

  async create(collection: string, data: any) {
    const params = new URLSearchParams({ collection });
    const response = await fetch(`${this.baseUrl}?${params}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create ${collection}: ${response.statusText}`);
    }
    return response.json();
  }

  async update(collection: string, id: string, data: any) {
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
    return response.json();
  }

  async delete(collection: string, id: string) {
    const params = new URLSearchParams({ collection, id });
    const response = await fetch(`${this.baseUrl}?${params}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete ${collection}: ${response.statusText}`);
    }
    return response.json();
  }
}

export const apiClient = new ApiClient();
