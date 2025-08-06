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
    return headers;
  }

  async request<T = any>(
    query: any, // Can be string or DocumentNode
    variables?: Record<string, any>,
  ): Promise<T> {
    // Convert DocumentNode to string if needed
    const queryString = typeof query === 'string' ? query : print(query);

    try {
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

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Expected JSON response but got ${contentType}`);
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(
          `GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`,
        );
      }

      return result.data;
    } catch (error) {
      // During static generation, return empty data instead of throwing
      if (typeof window === 'undefined') {
        console.warn(
          'GraphQL request failed during SSR, returning empty data:',
          error,
        );
        // Return a more specific empty structure based on the query
        if (queryString.includes('calendars')) {
          return { calendars: [] } as T;
        }
        if (
          queryString.includes('users') ||
          queryString.includes('students') ||
          queryString.includes('teachers')
        ) {
          return { users: [], students: [], teachers: [] } as T;
        }
        if (queryString.includes('pbisCardsCount')) {
          return { pbisCardsCount: 0 } as T;
        }
        return {} as T;
      }
      throw error;
    }
  }
}
