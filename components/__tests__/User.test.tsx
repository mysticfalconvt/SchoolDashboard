import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useUser } from '../User';
import { mockQueries, mockUser } from '../../__tests__/utils/test-utils';

// Mock the useGQLQuery hook
jest.mock('../../lib/useGqlQuery', () => ({
  useGQLQuery: jest.fn(),
}));

const { useGQLQuery } = require('../../lib/useGqlQuery');

describe('useUser Hook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0,
          staleTime: 0,
        },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('should return user data when authenticated', async () => {
    useGQLQuery
      .mockReturnValueOnce({
        data: mockQueries.GET_ALL_PBIS_DATES,
        isLoading: false,
        error: null,
      })
      .mockReturnValueOnce({
        data: mockQueries.CURRENT_USER_QUERY,
        isLoading: false,
        error: null,
      });

    const { result } = renderHook(() => useUser(), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    expect(result.current).toEqual(expect.objectContaining({
      id: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      isStaff: mockUser.isStaff,
      isTeacher: mockUser.isTeacher,
    }));
  });

  it('should return undefined when not authenticated', async () => {
    useGQLQuery
      .mockReturnValueOnce({
        data: mockQueries.GET_ALL_PBIS_DATES,
        isLoading: false,
        error: null,
      })
      .mockReturnValueOnce({
        data: { authenticatedItem: null },
        isLoading: false,
        error: null,
      });

    const { result } = renderHook(() => useUser(), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeUndefined();
    });
  });

  it('should set teacher PBIS card count for staff users', async () => {
    const staffUser = {
      ...mockUser,
      isStaff: true,
      teacherPbisCardCount: 50,
      teacherYearPbisCount: 200,
    };

    useGQLQuery
      .mockReturnValueOnce({
        data: mockQueries.GET_ALL_PBIS_DATES,
        isLoading: false,
        error: null,
      })
      .mockReturnValueOnce({
        data: { authenticatedItem: staffUser },
        isLoading: false,
        error: null,
      });

    const { result } = renderHook(() => useUser(), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    expect(result.current?.PbisCardCount).toBe(50);
    expect(result.current?.YearPbisCount).toBe(200);
  });

  it('should include lastCollection date', async () => {
    useGQLQuery
      .mockReturnValueOnce({
        data: mockQueries.GET_ALL_PBIS_DATES,
        isLoading: false,
        error: null,
      })
      .mockReturnValueOnce({
        data: mockQueries.CURRENT_USER_QUERY,
        isLoading: false,
        error: null,
      });

    const { result } = renderHook(() => useUser(), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    expect(result.current?.lastCollection).toBeDefined();
    expect(typeof result.current?.lastCollection).toBe('string');
  });

  it('should handle loading state', async () => {
    useGQLQuery
      .mockReturnValueOnce({
        data: null,
        isLoading: true,
        error: null,
      })
      .mockReturnValueOnce({
        data: null,
        isLoading: true,
        error: null,
      });

    const { result } = renderHook(() => useUser(), { wrapper });

    expect(result.current).toBeUndefined();
  });

  it('should handle error state', async () => {
    useGQLQuery
      .mockReturnValueOnce({
        data: mockQueries.GET_ALL_PBIS_DATES,
        isLoading: false,
        error: null,
      })
      .mockReturnValueOnce({
        data: null,
        isLoading: false,
        error: new Error('Authentication failed'),
      });

    const { result } = renderHook(() => useUser(), { wrapper });

    expect(result.current).toBeUndefined();
  });

  it('should use fallback date when no PBIS dates available', async () => {
    useGQLQuery
      .mockReturnValueOnce({
        data: { pbisCollectionDates: [] },
        isLoading: false,
        error: null,
      })
      .mockReturnValueOnce({
        data: mockQueries.CURRENT_USER_QUERY,
        isLoading: false,
        error: null,
      });

    const { result } = renderHook(() => useUser(), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    expect(result.current?.lastCollection).toBeDefined();
    // Should be using the TWO_YEARS_AGO fallback
    const lastCollection = new Date(result.current?.lastCollection || '');
    const now = new Date();
    const yearsDiff = now.getFullYear() - lastCollection.getFullYear();
    expect(yearsDiff).toBeCloseTo(2, 0);
  });

  it('should memoize user data to prevent unnecessary re-renders', async () => {
    useGQLQuery
      .mockReturnValue({
        data: mockQueries.GET_ALL_PBIS_DATES,
        isLoading: false,
        error: null,
      })
      .mockReturnValue({
        data: mockQueries.CURRENT_USER_QUERY,
        isLoading: false,
        error: null,
      });

    const { result, rerender } = renderHook(() => useUser(), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    const firstResult = result.current;
    rerender();
    
    // Should be the same object reference due to memoization
    expect(result.current).toBe(firstResult);
  });
});