import { GraphQLClient } from '../graphqlClient';
import gql from 'graphql-tag';

// Mock fetch globally
global.fetch = jest.fn();

describe('GraphQLClient', () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
  const testUrl = 'https://api.example.com/graphql';

  beforeEach(() => {
    mockFetch.mockClear();
    // Don't automatically add window - let individual tests control it
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    beforeEach(() => {
      // Ensure window exists for client-side behavior testing
      if (typeof window === 'undefined') {
        (global as any).window = {};
      }
    });

    it('creates client with basic configuration', () => {
      const client = new GraphQLClient(testUrl);
      expect(client).toBeInstanceOf(GraphQLClient);
    });

    it('creates client with custom headers', () => {
      const client = new GraphQLClient(testUrl, {
        headers: {
          'Authorization': 'Bearer token',
          'Custom-Header': 'value',
        },
      });
      expect(client).toBeInstanceOf(GraphQLClient);
    });

    it('extracts fetch options from headers', () => {
      const client = new GraphQLClient(testUrl, {
        headers: {
          'Authorization': 'Bearer token',
          credentials: 'include',
          mode: 'cors',
        },
      });
      expect(client).toBeInstanceOf(GraphQLClient);
    });
  });

  describe('request method', () => {
    let client: GraphQLClient;

    beforeEach(() => {
      // Ensure window exists for client-side behavior testing  
      if (typeof window === 'undefined') {
        (global as any).window = {};
      }
      
      client = new GraphQLClient(testUrl, {
        headers: {
          'Authorization': 'Bearer test-token',
        },
      });
    });

    it('makes successful GraphQL request with string query', async () => {
      const mockResponse = {
        ok: true,
        statusText: 'OK',
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({
          data: { users: [{ id: '1', name: 'John' }] },
        }),
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const query = 'query { users { id name } }';
      const result = await client.request(query);

      expect(mockFetch).toHaveBeenCalledWith(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({
          query,
          variables: undefined,
        }),
        credentials: undefined,
        mode: undefined,
      });

      expect(result).toEqual({ users: [{ id: '1', name: 'John' }] });
    });

    it('makes successful GraphQL request with DocumentNode query', async () => {
      const mockResponse = {
        ok: true,
        statusText: 'OK',
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({
          data: { users: [{ id: '1', name: 'John' }] },
        }),
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const query = gql`
        query GetUsers($limit: Int) {
          users(limit: $limit) {
            id
            name
          }
        }
      `;
      const variables = { limit: 10 };

      const result = await client.request(query, variables);

      expect(mockFetch).toHaveBeenCalledWith(testUrl, expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('GetUsers'),
      }));

      expect(result).toEqual({ users: [{ id: '1', name: 'John' }] });
    });

    it('includes variables in request', async () => {
      const mockResponse = {
        ok: true,
        statusText: 'OK',
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({
          data: { user: { id: '1', name: 'John' } },
        }),
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const query = 'query GetUser($id: ID!) { user(id: $id) { id name } }';
      const variables = { id: '1' };

      await client.request(query, variables);

      expect(mockFetch).toHaveBeenCalledWith(testUrl, expect.objectContaining({
        body: JSON.stringify({
          query,
          variables,
        }),
      }));
    });

    it('throws error on network failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const query = 'query { users { id } }';

      await expect(client.request(query)).rejects.toThrow('Network error');
    });

    it('throws error on non-OK response', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'Bad Request',
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const query = 'query { users { id } }';

      await expect(client.request(query)).rejects.toThrow('GraphQL request failed: Bad Request');
    });

    it('throws error on non-JSON response', async () => {
      const mockResponse = {
        ok: true,
        statusText: 'OK',
        headers: {
          get: jest.fn().mockReturnValue('text/html'),
        },
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const query = 'query { users { id } }';

      await expect(client.request(query)).rejects.toThrow('Expected JSON response but got text/html');
    });

    it('throws error on GraphQL errors', async () => {
      const mockResponse = {
        ok: true,
        statusText: 'OK',
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({
          errors: [
            { message: 'Field "nonExistent" doesn\'t exist' },
            { message: 'Validation error' },
          ],
        }),
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const query = 'query { nonExistent }';

      await expect(client.request(query)).rejects.toThrow(
        'GraphQL errors: Field "nonExistent" doesn\'t exist, Validation error'
      );
    });

    it('handles network errors by rethrowing in client-side environment', async () => {
      mockFetch.mockImplementation(() => Promise.reject(new Error('Network error')));

      const query = 'query { users { id } }';

      await expect(client.request(query)).rejects.toThrow('Network error');
    });

    it('handles missing content-type header gracefully', async () => {
      const mockResponse = {
        ok: true,
        statusText: 'OK',
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const query = 'query { users { id } }';

      await expect(client.request(query)).rejects.toThrow('Expected JSON response but got null');
    });

    it('handles empty response body', async () => {
      const mockResponse = {
        ok: true,
        statusText: 'OK',
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue(null),
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const query = 'query { users { id } }';

      // Should throw error when trying to access data on null response
      await expect(client.request(query)).rejects.toThrow();
    });
  });

  describe('fetch options', () => {
    beforeEach(() => {
      // Ensure window exists for client-side behavior testing
      if (typeof window === 'undefined') {
        (global as any).window = {};
      }
    });

    it('applies credentials and mode from headers', async () => {
      const client = new GraphQLClient(testUrl, {
        headers: {
          credentials: 'include',
          mode: 'cors',
          'Authorization': 'Bearer token',
        },
      });

      const mockResponse = {
        ok: true,
        statusText: 'OK',
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({ data: {} }),
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      await client.request('query { test }');

      expect(mockFetch).toHaveBeenCalledWith(testUrl, expect.objectContaining({
        credentials: 'include',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token',
        },
      }));
    });
  });
});