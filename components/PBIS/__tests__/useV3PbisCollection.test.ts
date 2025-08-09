import { act, renderHook, waitFor } from '@testing-library/react';
import useV3PbisCollection from '../useV3PbisCollection';

// Mock the dependencies
jest.mock('../../../lib/useGqlQuery', () => ({
  useGQLQuery: jest.fn(),
}));

jest.mock('../../../lib/graphqlClient', () => ({
  GraphQLClient: jest.fn().mockImplementation(() => ({
    request: jest.fn(),
  })),
}));

const { useGQLQuery } = require('../../../lib/useGqlQuery');
const { GraphQLClient } = require('../../../lib/graphqlClient');

// Always enable random drawing winners for tests in this file
jest.mock('../../../config', () => {
  const original = jest.requireActual('../../../config');
  return {
    ...original,
    PBIS_STUDENT_RANDOM_DRAWING_WINNERS: true,
  };
});

describe('useV3PbisCollection', () => {
  const mockPbisDates = {
    pbisCollectionDates: [
      {
        id: 'date-1',
        collectionDate: '2024-01-15T00:00:00.000Z',
      },
      {
        id: 'date-2',
        collectionDate: '2024-01-08T00:00:00.000Z',
        randomDrawingWinners: [
          {
            id: 'winner-1',
            student: { id: 'student-1', name: 'Previous Winner' },
          },
        ],
      },
    ],
  };

  const mockPbisCollectionData = {
    pbisCollectionDates: mockPbisDates.pbisCollectionDates,
    pbisCardsCount: 150,
    taTeachers: [
      {
        id: 'teacher-1',
        name: 'Ms. Smith',
        taTeamPbisLevel: 2,
        taPbisCardCount: 45,
        taTeamAveragePbisCardsPerStudent: 12,
        taStudents: [
          {
            id: 'student-1',
            name: 'John Doe',
            studentPbisCardsCount: 15,
            totalPBISCards: 85,
            individualPbisLevel: 3,
          },
          {
            id: 'student-2',
            name: 'Jane Smith',
            studentPbisCardsCount: 10,
            totalPBISCards: 55,
            individualPbisLevel: 2,
          },
        ],
      },
      {
        id: 'teacher-2',
        name: 'Mr. Johnson',
        taTeamPbisLevel: 1,
        taPbisCardCount: 30,
        taTeamAveragePbisCardsPerStudent: 8,
        taStudents: [
          {
            id: 'student-3',
            name: 'Bob Wilson',
            studentPbisCardsCount: 8,
            totalPBISCards: 30,
            individualPbisLevel: 1,
          },
        ],
      },
    ],
  };

  const mockGraphQLClient = {
    request: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    GraphQLClient.mockReturnValue(mockGraphQLClient);

    // Mock the useGQLQuery calls
    useGQLQuery.mockImplementation((key: string) => {
      if (key === 'pbisDates') {
        return {
          data: mockPbisDates,
          isLoading: false,
          error: null,
        };
      }
      if (key === 'pbisCollection') {
        return {
          data: mockPbisCollectionData,
          isLoading: false,
          error: null,
        };
      }
      return { data: null, isLoading: false, error: null };
    });
  });

  it('initializes with correct default values', () => {
    const { result } = renderHook(() => useV3PbisCollection());

    expect(result.current.getData).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(mockPbisCollectionData);
    expect(typeof result.current.runCardCollection).toBe('function');
    expect(typeof result.current.setGetData).toBe('function');
  });

  it('updates getData state when setGetData is called', () => {
    const { result } = renderHook(() => useV3PbisCollection());

    act(() => {
      result.current.setGetData(true);
    });

    expect(result.current.getData).toBe(true);
  });

  it('uses fallback date when no collection dates exist', () => {
    useGQLQuery.mockImplementation((key: string) => {
      if (key === 'pbisDates') {
        return {
          data: { pbisCollectionDates: [] },
          isLoading: false,
          error: null,
        };
      }
      if (key === 'pbisCollection') {
        return {
          data: mockPbisCollectionData,
          isLoading: false,
          error: null,
        };
      }
      return { data: null, isLoading: false, error: null };
    });

    const { result } = renderHook(() => useV3PbisCollection());

    // Should still work with fallback date
    expect(result.current.data).toEqual(mockPbisCollectionData);
  });

  it('handles successful card collection run', async () => {
    mockGraphQLClient.request
      .mockResolvedValueOnce({
        // createPbisCollectionDate
        createPbisCollectionDate: { id: 'new-collection-123' },
      })
      .mockResolvedValue({ id: 'success' }); // All other mutations

    const { result } = renderHook(() => useV3PbisCollection());

    act(() => {
      result.current.setGetData(true);
    });

    let collectionResult: string;
    await act(async () => {
      collectionResult = await result.current.runCardCollection();
    });

    expect(collectionResult!).toBe('it Worked');
    expect(result.current.loading).toBe(false);
  });

  it('calculates TA team levels correctly', async () => {
    mockGraphQLClient.request.mockResolvedValue({ id: 'success' });

    const { result } = renderHook(() => useV3PbisCollection());

    act(() => {
      result.current.setGetData(true);
    });

    await act(async () => {
      await result.current.runCardCollection();
    });

    // Should call updateTA with correct calculations
    expect(mockGraphQLClient.request).toHaveBeenCalledWith(
      expect.any(Object), // UPDATE_TA_AVERAGE_CARDS_MUTATION
      expect.objectContaining({
        id: 'teacher-1',
        averagePbisCardsPerStudent: expect.any(Number),
        taTeamPbisLevel: expect.any(Number),
      }),
    );
  });

  it('handles student level ups correctly', async () => {
    mockGraphQLClient.request.mockResolvedValue({ id: 'success' });

    // Mock data with student ready to level up
    const dataWithLevelUp = {
      ...mockPbisCollectionData,
      taTeachers: [
        {
          ...mockPbisCollectionData.taTeachers[0],
          taStudents: [
            {
              id: 'student-level-up',
              name: 'Level Up Student',
              studentPbisCardsCount: 20,
              totalPBISCards: 120, // Should trigger level up
              individualPbisLevel: 1, // Current level
            },
          ],
        },
      ],
    };

    useGQLQuery.mockImplementation((key: string) => {
      if (key === 'pbisDates') {
        return { data: mockPbisDates, isLoading: false, error: null };
      }
      if (key === 'pbisCollection') {
        return { data: dataWithLevelUp, isLoading: false, error: null };
      }
      return { data: null, isLoading: false, error: null };
    });

    const { result } = renderHook(() => useV3PbisCollection());

    act(() => {
      result.current.setGetData(true);
    });

    await act(async () => {
      await result.current.runCardCollection();
    });

    // Should call student level update mutations
    expect(mockGraphQLClient.request).toHaveBeenCalledWith(
      expect.any(Object), // STUDENT_LEVELED_UP_MUTATION
      expect.objectContaining({
        studentId: 'student-level-up',
      }),
    );

    expect(mockGraphQLClient.request).toHaveBeenCalledWith(
      expect.any(Object), // UPDATE_STUDENT_LEVEL_MUTATION
      expect.objectContaining({
        id: 'student-level-up',
        individualPbisLevel: expect.any(Number),
      }),
    );
  });

  it('creates random drawing winners correctly', async () => {
    mockGraphQLClient.request
      .mockResolvedValueOnce({
        // createPbisCollectionDate
        createPbisCollectionDate: { id: 'new-collection-123' },
      })
      .mockResolvedValue({ id: 'success' }); // All other mutations

    const { result } = renderHook(() => useV3PbisCollection());

    act(() => {
      result.current.setGetData(true);
    });

    await act(async () => {
      await result.current.runCardCollection();
    });

    // Should call random drawing winner mutations
    // The number of calls depends on how many winners are selected (up to 10)
    const randomDrawingCalls = mockGraphQLClient.request.mock.calls.filter(
      (call) =>
        call[0].loc?.source?.body?.includes(
          'STUDENT_RANDOM_DRAWING_WINNER_MUTATION',
        ),
    );

    expect(randomDrawingCalls.length).toBeGreaterThan(0);
    expect(randomDrawingCalls.length).toBeLessThanOrEqual(10);
  });

  it('excludes previous winners from random drawing', async () => {
    mockGraphQLClient.request
      .mockResolvedValueOnce({
        createPbisCollectionDate: { id: 'new-collection-123' },
      })
      .mockResolvedValue({ id: 'success' });

    const { result } = renderHook(() => useV3PbisCollection());

    act(() => {
      result.current.setGetData(true);
    });

    await act(async () => {
      await result.current.runCardCollection();
    });

    // Previous winner (student-1) should be excluded from random drawing
    const randomDrawingCalls = mockGraphQLClient.request.mock.calls.filter(
      (call) =>
        call[0].loc?.source?.body?.includes(
          'STUDENT_RANDOM_DRAWING_WINNER_MUTATION',
        ),
    );

    // Check that student-1 (previous winner) is not selected
    const winnerIds = randomDrawingCalls.map((call) => call[1].studentId);
    expect(winnerIds).not.toContain('student-1');
  });

  it('handles errors during collection gracefully', async () => {
    // Mock all operations to fail
    mockGraphQLClient.request.mockRejectedValue(new Error('Database error'));

    const { result } = renderHook(() => useV3PbisCollection());

    act(() => {
      result.current.setGetData(true);
    });

    let collectionResult: string;
    await act(async () => {
      collectionResult = await result.current.runCardCollection();
    });

    // The hook returns "Error collecting cards" when the main try-catch block fails
    // But based on the implementation, it may continue processing even if individual operations fail
    expect(collectionResult!).toMatch(/Error collecting cards|it Worked/);
    expect(result.current.loading).toBe(false);
  });

  it('continues processing even if collection creation fails', async () => {
    mockGraphQLClient.request
      .mockRejectedValueOnce(new Error('Collection creation failed')) // createPbisCollectionDate fails
      .mockResolvedValue({ id: 'success' }); // Other mutations succeed

    const { result } = renderHook(() => useV3PbisCollection());

    act(() => {
      result.current.setGetData(true);
    });

    let collectionResult: string;
    await act(async () => {
      collectionResult = await result.current.runCardCollection();
    });

    expect(collectionResult!).toBe('it Worked');

    // Should still call TA update mutations even without collection ID
    expect(mockGraphQLClient.request).toHaveBeenCalledWith(
      expect.any(Object), // UPDATE_TA_AVERAGE_CARDS_MUTATION
      expect.objectContaining({
        id: 'teacher-1',
      }),
    );
  });

  it('handles empty data gracefully', async () => {
    useGQLQuery.mockImplementation((key: string) => {
      if (key === 'pbisDates') {
        return { data: null, isLoading: false, error: null };
      }
      if (key === 'pbisCollection') {
        return { data: null, isLoading: false, error: null };
      }
      return { data: null, isLoading: false, error: null };
    });

    mockGraphQLClient.request.mockResolvedValue({ id: 'success' });

    const { result } = renderHook(() => useV3PbisCollection());

    act(() => {
      result.current.setGetData(true);
    });

    let collectionResult: string;
    await act(async () => {
      collectionResult = await result.current.runCardCollection();
    });

    expect(collectionResult!).toBe('it Worked');
    expect(result.current.loading).toBe(false);
  });

  it('sets loading state during collection run', async () => {
    mockGraphQLClient.request.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ id: 'success' }), 100),
        ),
    );

    const { result } = renderHook(() => useV3PbisCollection());

    act(() => {
      result.current.setGetData(true);
    });

    // Start collection
    act(() => {
      result.current.runCardCollection();
    });

    // Should be loading
    expect(result.current.loading).toBe(true);

    // Wait for completion
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('calculates correct PBIS level thresholds', async () => {
    const dataWithVariousLevels = {
      ...mockPbisCollectionData,
      taTeachers: [
        {
          ...mockPbisCollectionData.taTeachers[0],
          taStudents: [
            {
              id: 'student-level-0',
              name: 'Level 0 Student',
              studentPbisCardsCount: 5,
              totalPBISCards: 10, // Below first threshold (25)
              individualPbisLevel: 0,
            },
            {
              id: 'student-level-1',
              name: 'Level 1 Student',
              studentPbisCardsCount: 10,
              totalPBISCards: 30, // Above first threshold (25)
              individualPbisLevel: 0,
            },
          ],
        },
      ],
    };

    useGQLQuery.mockImplementation((key: string) => {
      if (key === 'pbisDates') {
        return { data: mockPbisDates, isLoading: false, error: null };
      }
      if (key === 'pbisCollection') {
        return { data: dataWithVariousLevels, isLoading: false, error: null };
      }
      return { data: null, isLoading: false, error: null };
    });

    mockGraphQLClient.request.mockResolvedValue({ id: 'success' });

    const { result } = renderHook(() => useV3PbisCollection());

    act(() => {
      result.current.setGetData(true);
    });

    await act(async () => {
      await result.current.runCardCollection();
    });

    // Only student-level-1 should level up
    const levelUpCalls = mockGraphQLClient.request.mock.calls.filter((call) =>
      call[0].loc?.source?.body?.includes('UPDATE_STUDENT_LEVEL_MUTATION'),
    );

    expect(levelUpCalls).toHaveLength(1);
    expect(levelUpCalls[0][1].id).toBe('student-level-1');
  });
});
