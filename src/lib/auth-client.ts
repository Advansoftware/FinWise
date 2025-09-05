// src/lib/auth-client.ts

export class AuthClient {
  private baseUrl = '/api/auth';

  async login(email: string, password: string) {
    const response = await fetch(`${this.baseUrl}?action=login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
    return response.json();
  }

  async signup(email: string, password: string, name: string) {
    const response = await fetch(`${this.baseUrl}?action=signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }
    return response.json();
  }

  async logout() {
    const response = await fetch(`${this.baseUrl}?action=logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Logout failed');
    }
    return response.json();
  }

  async getCurrentUser() {
    const response = await fetch(`${this.baseUrl}?action=getCurrentUser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      return null;
    }
    return response.json();
  }

  async updateUser(userId: string, updates: any) {
    const response = await fetch(`${this.baseUrl}?action=updateUser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, updates }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Update failed');
    }
    return response.json();
  }
}

export const authClient = new AuthClient();
