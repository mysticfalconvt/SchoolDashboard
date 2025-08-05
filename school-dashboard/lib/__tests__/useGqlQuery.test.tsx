import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import gql from 'graphql-tag';
import { useGQLQuery, useAsyncGQLQuery } from '../useGqlQuery';

// Mock fetch globally since the GraphQL client uses it
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('useGqlQuery', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
          cacheTime: 0,
        },
      },
    });
    
    mockFetch.mockClear();
    mockFetch.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const testQuery = gql`
    query GetUsers($limit: Int) {
      users(limit: $limit) {
        id
        name
        email
      }
    }
  `;

  it('successfully fetches data', async () => {
    const mockData = {
      users: [
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
      ],
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockData }),
      headers: {
        get: () => 'application/json',
      },
    });

    const { result } = renderHook(
      () => useGQLQuery('test-users', testQuery, { limit: 10 }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('handles query without variables', async () => {
    const mockData = { users: [] };
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockData }),
      headers: {
        get: () => 'application/json',
      },
    });

    const { result } = renderHook(
      () => useGQLQuery('test-users-no-vars', testQuery),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
  });

  it('handles query errors', async () => {
    const mockError = new Error('GraphQL error: User not found');
    mockFetch.mockRejectedValue(mockError);

    const { result } = renderHook(
      () => useGQLQuery('test-users-error', testQuery),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('uses custom react-query config', async () => {
    const mockData = { users: [] };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockData }),
      headers: {
        get: () => 'application/json',
      },
    });

    const { result } = renderHook(
      () => useGQLQuery('test-config', testQuery, undefined, {
        enabled: false,
        staleTime: 5000,
      }),
      { wrapper }
    );

    // Query should not execute because enabled: false
    expect(result.current.isFetching).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('refetches data when variables change', async () => {
    const mockData1 = { users: [{ id: '1', name: 'John' }] };
    const mockData2 = { users: [{ id: '1', name: 'John' }, { id: '2', name: 'Jane' }] };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockData1 }),
        headers: { get: () => 'application/json' },
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockData2 }),
        headers: { get: () => 'application/json' },
      });

    const { result, rerender } = renderHook(
      ({ limit }: { limit: number }) => useGQLQuery(['test-refetch', { limit }], testQuery, { limit }),
      {
        wrapper,
        initialProps: { limit: 1 },
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData1);

    // Change variables - this should trigger a refetch with different query key
    rerender({ limit: 2 });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData2);
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

describe('useAsyncGQLQuery', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockFetch.mockReset();
  });

  const testQuery = gql`
    query GetUser($id: ID!) {
      user(id: $id) {
        id
        name
      }
    }
  `;

  it('returns async function for GraphQL requests', async () => {
    const mockData = { user: { id: '1', name: 'John' } };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockData }),
      headers: { get: () => 'application/json' },
    });

    const { result } = renderHook(() => useAsyncGQLQuery(testQuery));

    const fetchUser = result.current;
    expect(typeof fetchUser).toBe('function');

    const data = await fetchUser({ id: '1' });
    
    expect(data).toEqual(mockData);
  });

  it('works without variables', async () => {
    const mockData = { users: [] };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockData }),
      headers: { get: () => 'application/json' },
    });

    const { result } = renderHook(() => useAsyncGQLQuery(gql`query { users { id } }`));

    const fetchData = result.current;
    const data = await fetchData();
    
    expect(data).toEqual(mockData);
  });

  it('propagates errors from GraphQL client', async () => {
    const mockError = new Error('Network error');
    mockFetch.mockRejectedValue(mockError);

    const { result } = renderHook(() => useAsyncGQLQuery(testQuery));

    const fetchUser = result.current;
    
    await expect(fetchUser({ id: '1' })).rejects.toThrow('Network error');
  });

  it('can be called multiple times with different variables', async () => {
    const mockData1 = { user: { id: '1', name: 'John' } };
    const mockData2 = { user: { id: '2', name: 'Jane' } };
    
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockData1 }),
        headers: { get: () => 'application/json' },
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockData2 }),
        headers: { get: () => 'application/json' },
      });

    const { result } = renderHook(() => useAsyncGQLQuery(testQuery));

    const fetchUser = result.current;
    
    const result1 = await fetchUser({ id: '1' });
    const result2 = await fetchUser({ id: '2' });
    
    expect(result1).toEqual(mockData1);
    expect(result2).toEqual(mockData2);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});