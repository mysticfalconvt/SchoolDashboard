import { act, renderHook, waitFor } from '@testing-library/react';
import gql from 'graphql-tag';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { GraphQLClient } from '../graphqlClient';
import { useGqlMutation } from '../useGqlMutation';

// Mock the GraphQLClient
jest.mock('../graphqlClient', () => ({
  GraphQLClient: jest.fn().mockImplementation(() => ({
    request: jest.fn(),
  })),
}));

// Mock config
jest.mock('../../config', () => ({
  endpoint: 'http://localhost:3000/api/graphql',
  prodEndpoint: 'https://api.example.com/graphql',
}));

const MockedGraphQLClient = GraphQLClient as jest.MockedClass<
  typeof GraphQLClient
>;

describe('useGqlMutation', () => {
  let queryClient: QueryClient;
  let mockRequest: jest.Mock;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    mockRequest = jest.fn();
    MockedGraphQLClient.mockImplementation(
      () =>
        ({
          request: mockRequest,
        }) as any,
    );

    // Spy on queryClient methods
    jest.spyOn(queryClient, 'invalidateQueries');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createUserMutation = gql`
    mutation CreateUser($input: CreateUserInput!) {
      createUser(input: $input) {
        id
        name
        email
      }
    }
  `;

  it('returns Apollo-style mutation result', () => {
    const { result } = renderHook(() => useGqlMutation(createUserMutation), {
      wrapper,
    });

    const [mutate, mutationResult] = result.current;

    expect(typeof mutate).toBe('function');
    expect(mutationResult).toMatchObject({
      data: undefined,
      loading: false,
      error: null,
    });
  });

  it('executes successful mutation', async () => {
    const mockResponse = {
      createUser: {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
      },
    };

    mockRequest.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useGqlMutation(createUserMutation), {
      wrapper,
    });

    const [mutate] = result.current;

    const variables = {
      input: {
        name: 'John Doe',
        email: 'john@example.com',
      },
    };

    await act(async () => {
      mutate(variables);
    });

    await waitFor(() => {
      expect(result.current[1].data).toEqual(mockResponse);
    });

    expect(result.current[1].loading).toBe(false);
    expect(result.current[1].error).toBeNull();
    expect(mockRequest).toHaveBeenCalledWith(createUserMutation, variables);
  });

  it('handles mutation errors', async () => {
    const mockError = new Error('Validation failed');
    mockRequest.mockRejectedValue(mockError);

    const { result } = renderHook(() => useGqlMutation(createUserMutation), {
      wrapper,
    });

    const [mutate] = result.current;

    await act(async () => {
      mutate({ input: { name: 'John' } });
    });

    await waitFor(() => {
      expect(result.current[1].error).toEqual(mockError);
    });

    expect(result.current[1].loading).toBe(false);
    expect(result.current[1].data).toBeUndefined();
  });

  it('shows loading state during mutation', async () => {
    // Create a controlled promise
    let resolvePromise: (value: any) => void;
    const controlledPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockRequest.mockReturnValue(controlledPromise);

    const { result } = renderHook(() => useGqlMutation(createUserMutation), {
      wrapper,
    });

    const [mutate] = result.current;

    act(() => {
      mutate({ input: { name: 'John' } });
    });

    // Should be loading
    await waitFor(() => {
      expect(result.current[1].loading).toBe(true);
    });

    // Resolve the promise
    const mockResponse = { createUser: { id: '1', name: 'John' } };
    act(() => {
      resolvePromise!(mockResponse);
    });

    await waitFor(() => {
      expect(result.current[1].loading).toBe(false);
    });

    expect(result.current[1].data).toEqual(mockResponse);
  });

  it('invalidates queries on success', async () => {
    const mockResponse = { createUser: { id: '1', name: 'John' } };
    mockRequest.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useGqlMutation(createUserMutation), {
      wrapper,
    });

    const [mutate] = result.current;

    await act(async () => {
      mutate({ input: { name: 'John' } });
    });

    await waitFor(() => {
      expect(result.current[1].data).toEqual(mockResponse);
    });

    expect(queryClient.invalidateQueries).toHaveBeenCalled();
  });

  it('does not invalidate queries on error', async () => {
    const mockError = new Error('Mutation failed');
    mockRequest.mockRejectedValue(mockError);

    const { result } = renderHook(() => useGqlMutation(createUserMutation), {
      wrapper,
    });

    const [mutate] = result.current;

    await act(async () => {
      mutate({ input: { name: 'John' } });
    });

    await waitFor(() => {
      expect(result.current[1].error).toEqual(mockError);
    });

    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
  });

  it('uses correct GraphQL client based on environment', async () => {
    const originalEnv = process.env.NODE_ENV;
    const mockResponse = { createUser: { id: '1', name: 'John' } };
    mockRequest.mockResolvedValue(mockResponse);

    // Development environment
    (process.env as any).NODE_ENV = 'development';
    const { result: devResult } = renderHook(
      () => useGqlMutation(createUserMutation),
      { wrapper },
    );

    // Execute mutation to trigger client creation
    await act(async () => {
      devResult.current[0]({ input: { name: 'John' } });
    });

    expect(MockedGraphQLClient).toHaveBeenCalledWith(
      'http://localhost:3000/api/graphql',
      expect.objectContaining({
        headers: {
          credentials: 'include',
          mode: 'cors',
        },
      }),
    );

    // Clear mocks for production test
    MockedGraphQLClient.mockClear();

    // Production environment
    (process.env as any).NODE_ENV = 'production';
    const { result: prodResult } = renderHook(
      () => useGqlMutation(createUserMutation),
      { wrapper },
    );

    // Execute mutation to trigger client creation
    await act(async () => {
      prodResult.current[0]({ input: { name: 'John' } });
    });

    expect(MockedGraphQLClient).toHaveBeenCalledWith(
      'https://api.example.com/graphql',
      expect.any(Object),
    );

    (process.env as any).NODE_ENV = originalEnv;
  });

  it('accepts custom mutation options', async () => {
    const onSuccessSpy = jest.fn();
    const onErrorSpy = jest.fn();

    const mockResponse = { createUser: { id: '1', name: 'John' } };
    mockRequest.mockResolvedValue(mockResponse);

    const { result } = renderHook(
      () =>
        useGqlMutation(createUserMutation, {
          onSuccess: onSuccessSpy,
          onError: onErrorSpy,
        }),
      { wrapper },
    );

    const [mutate] = result.current;

    await act(async () => {
      mutate({ input: { name: 'John' } });
    });

    await waitFor(() => {
      expect(result.current[1].data).toEqual(mockResponse);
    });

    expect(onSuccessSpy).toHaveBeenCalledWith(
      mockResponse,
      { input: { name: 'John' } },
      undefined,
    );
    expect(onErrorSpy).not.toHaveBeenCalled();
  });

  it('calls custom error handler on failure', async () => {
    const onSuccessSpy = jest.fn();
    const onErrorSpy = jest.fn();
    const mockError = new Error('Custom error');

    mockRequest.mockRejectedValue(mockError);

    const { result } = renderHook(
      () =>
        useGqlMutation(createUserMutation, {
          onSuccess: onSuccessSpy,
          onError: onErrorSpy,
        }),
      { wrapper },
    );

    const [mutate] = result.current;

    await act(async () => {
      mutate({ input: { name: 'John' } });
    });

    await waitFor(() => {
      expect(result.current[1].error).toEqual(mockError);
    });

    expect(onErrorSpy).toHaveBeenCalledWith(
      mockError,
      { input: { name: 'John' } },
      undefined,
    );
    expect(onSuccessSpy).not.toHaveBeenCalled();
  });

  it('can execute mutation without variables', async () => {
    const simpleMutation = gql`
      mutation RefreshCache {
        refreshCache
      }
    `;

    const mockResponse = { refreshCache: true };
    mockRequest.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useGqlMutation(simpleMutation), {
      wrapper,
    });

    const [mutate] = result.current;

    await act(async () => {
      mutate({});
    });

    await waitFor(() => {
      expect(result.current[1].data).toEqual(mockResponse);
    });

    expect(mockRequest).toHaveBeenCalledWith(simpleMutation, {});
  });

  describe('with TypeScript types', () => {
    interface CreateUserInput {
      name: string;
      email: string;
    }

    interface CreateUserResponse {
      createUser: {
        id: string;
        name: string;
        email: string;
      };
    }

    it('provides proper TypeScript typing', async () => {
      const mockResponse: CreateUserResponse = {
        createUser: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
        },
      };

      mockRequest.mockResolvedValue(mockResponse);

      const { result } = renderHook(
        () =>
          useGqlMutation<CreateUserResponse, { input: CreateUserInput }>(
            createUserMutation,
          ),
        { wrapper },
      );

      const [mutate] = result.current;

      await act(async () => {
        mutate({ input: { name: 'John Doe', email: 'john@example.com' } });
      });

      await waitFor(() => {
        expect(result.current[1].data?.createUser.name).toBe('John Doe');
      });
    });
  });

  it('creates new GraphQL client instance for each mutation call', async () => {
    const mockResponse = { createUser: { id: '1', name: 'John' } };
    mockRequest.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useGqlMutation(createUserMutation), {
      wrapper,
    });

    const [mutate] = result.current;
    const initialCallCount = MockedGraphQLClient.mock.calls.length;

    // Execute mutation
    await act(async () => {
      mutate({ input: { name: 'John' } });
    });

    await waitFor(() => {
      expect(result.current[1].data).toEqual(mockResponse);
    });

    // New client should be created for each mutation call
    expect(MockedGraphQLClient.mock.calls.length).toBeGreaterThan(
      initialCallCount,
    );
  });

  it('handles concurrent mutations correctly', async () => {
    const mockResponse1 = { createUser: { id: '1', name: 'John' } };
    const mockResponse2 = { createUser: { id: '2', name: 'Jane' } };

    mockRequest
      .mockResolvedValueOnce(mockResponse1)
      .mockResolvedValueOnce(mockResponse2);

    const { result } = renderHook(() => useGqlMutation(createUserMutation), {
      wrapper,
    });

    const [mutate] = result.current;

    // Execute mutations concurrently
    await act(async () => {
      mutate({ input: { name: 'John' } });
      mutate({ input: { name: 'Jane' } });
    });

    await waitFor(() => {
      expect(result.current[1].data).toBeDefined();
    });

    expect(mockRequest).toHaveBeenCalledTimes(2);
  });
});
