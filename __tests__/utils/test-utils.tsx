import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { toast } from 'react-hot-toast';

// Mock GraphQL responses
export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  preferredName: 'Tester',
  canManageCalendar: true,
  canSeeOtherUsers: true,
  canManageUsers: false,
  canManageRoles: false,
  canManageLinks: true,
  canManageDiscipline: false,
  canSeeAllDiscipline: false,
  canSeeAllTeacherEvents: true,
  canSeeStudentEvents: true,
  canSeeOwnCallback: true,
  canSeeAllCallback: false,
  canManagePbis: false,
  canHaveSpecialGroups: false,
  hasTA: true,
  hasClasses: true,
  isStudent: false,
  isParent: false,
  isStaff: true,
  isTeacher: true,
  isSuperAdmin: false,
  PbisCardCount: 25,
  YearPbisCount: 150,
  teacherPbisCardCount: 25,
  teacherYearPbisCount: 150,
  sortingHat: 'Gryffindor',
  children: [],
  studentPbisCards: [],
  taTeam: {
    id: 'team-1',
    teamName: 'Test Team',
  },
  taTeacher: null,
  birthday: null,
  lastCollection: '2024-01-01T00:00:00.000Z',
};

export const mockCallback = {
  id: 'callback-123',
  title: 'Test Assignment',
  description: 'Complete the test assignment',
  link: 'https://example.com',
  dateAssigned: '2024-01-01T00:00:00.000Z',
  dateCompleted: null,
  messageFromTeacher: 'Please complete this assignment',
  messageFromTeacherDate: '2024-01-01T00:00:00.000Z',
  messageFromStudent: null,
  messageFromStudentDate: null,
  student: {
    id: 'student-123',
    name: 'Test Student',
    preferredName: 'Testy',
  },
  teacher: {
    id: 'teacher-123',
    name: 'Test Teacher',
  },
  block: 'B1',
};

export const mockCalendarEvent = {
  id: 'event-123',
  name: 'Test Event',
  description: 'This is a test event',
  status: 'Both',
  date: '2024-12-25T00:00:00.000Z',
  link: 'https://example.com',
  linkTitle: 'Event Link',
  author: mockUser,
};

export const mockPbisCollectionDate = {
  id: 'collection-123',
  collectionDate: '2024-01-01T00:00:00.000Z',
  collectedCards: '150',
  randomDrawingWinners: [],
  personalLevelWinners: [],
};

// Mock GraphQL queries
export const mockQueries = {
  GET_ALL_PBIS_DATES: {
    pbisCollectionDates: [mockPbisCollectionDate],
  },
  CURRENT_USER_QUERY: {
    authenticatedItem: mockUser,
  },
  TA_INFO_QUERY: {
    taTeacher: {
      ...mockUser,
      taStudents: [
        {
          id: 'student-1',
          name: 'Student One',
          preferredName: 'S1',
          callbackItems: [mockCallback],
          studentPbisCardsCount: 25,
          callbackCount: 1,
          parent: {
            id: 'parent-1',
            name: 'Parent One',
            email: 'parent1@example.com',
          },
        },
      ],
    },
  },
  GET_CALENDAR_EVENTS: {
    calendarEvents: [mockCalendarEvent],
  },
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) {
  const { queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
    },
  }), ...renderOptions } = options;

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock implementations for common hooks
export const mockUseUser = () => mockUser;

export const mockUseGQLQuery = (key: string, query: any, variables?: any) => {
  // Return mock data based on query key
  const mockData = {
    'pbisDates': mockQueries.GET_ALL_PBIS_DATES,
    'me': mockQueries.CURRENT_USER_QUERY,
    'taInfo': mockQueries.TA_INFO_QUERY,
    'calendarEvents': mockQueries.GET_CALENDAR_EVENTS,
  };

  return {
    data: mockData[key as keyof typeof mockData] || null,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
    isSuccess: true,
    isError: false,
  };
};

export const mockUseGqlMutation = () => [
  jest.fn().mockResolvedValue({ data: { success: true } }),
  {
    loading: false,
    error: null,
    data: null,
  },
];

// Utility functions for testing
export const createMockRouter = (overrides = {}) => ({
  route: '/',
  pathname: '/',
  query: {},
  asPath: '/',
  push: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
  back: jest.fn(),
  prefetch: jest.fn().mockResolvedValue(undefined),
  beforePopState: jest.fn(),
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
  isFallback: false,
  ...overrides,
});

export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 0));

// Toast mock helpers
export const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  loading: jest.fn(),
  dismiss: jest.fn(),
};

// Common test data generators
export const createMockStudent = (overrides = {}) => ({
  id: `student-${Math.random()}`,
  name: 'Test Student',
  preferredName: 'Testy',
  studentPbisCardsCount: 10,
  callbackCount: 1,
  callbackItems: [],
  parent: {
    id: 'parent-1',
    name: 'Test Parent',
    email: 'parent@example.com',
  },
  ...overrides,
});

export const createMockTeacher = (overrides = {}) => ({
  id: `teacher-${Math.random()}`,
  name: 'Test Teacher',
  email: 'teacher@example.com',
  hasTA: true,
  taStudents: [],
  ...overrides,
});

// Re-export everything from testing library
export * from '@testing-library/react';
export { renderWithProviders as render };