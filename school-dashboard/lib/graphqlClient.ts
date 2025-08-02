import { print } from 'graphql';

// Lightweight GraphQL client using native fetch
export class GraphQLClient {
  private url: string;
  private headers: Record<string, string>;
  private fetchOptions: RequestInit;

  constructor(url: string, options: { headers?: Record<string, string> } = {}) {
    this.url = url;
    this.headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Extract fetch-specific options from headers
    const { credentials, mode, ...actualHeaders } = this.headers;
    this.headers = actualHeaders;

    this.fetchOptions = {
      credentials: credentials as RequestCredentials,
      mode: mode as RequestMode,
    };
  }

  private getAuthHeaders(): Record<string, string> {
    const headers = { ...this.headers };

    // Add authentication token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        headers['authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async request<T = any>(
    query: any, // Can be string or DocumentNode
    variables?: Record<string, any>,
  ): Promise<T> {
    // Convert DocumentNode to string if needed
    const queryString = typeof query === 'string' ? query : print(query);

    const response = await fetch(this.url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        query: queryString,
        variables,
      }),
      ...this.fetchOptions,
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(
        `GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`,
      );
    }

    return result.data;
  }
}
