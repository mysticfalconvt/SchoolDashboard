import { screen } from '@testing-library/react';
import PbisPage from '../pages/pbis';
import { mockUser, renderWithProviders } from './utils/test-utils';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    query: {},
    pathname: '/pbis',
    route: '/pbis',
    asPath: '/pbis',
  }),
}));

// Mock dependencies
jest.mock('../components/User', () => ({
  useUser: jest.fn(),
}));

jest.mock('../lib/useGqlQuery', () => ({
  useGQLQuery: jest.fn(),
}));

jest.mock('../lib/isAllowed', () => jest.fn());

jest.mock('../config', () => ({
  ...jest.requireActual('../config'),
  ADMIN_ID: 'admin',
}));

// Mock chart components
jest.mock('../components/Chart/DonutChart', () => {
  return function MockDoughnutChart({ title, chartData }: any) {
    return (
      <div data-testid="doughnut-chart">
        <h3>{title}</h3>
        <div data-testid="chart-data">{JSON.stringify(chartData)}</div>
      </div>
    );
  };
});

jest.mock('../components/PBIS/DisplayPbisCollectionData', () => {
  return function MockDisplayPbisCollectionData({ collectionData }: any) {
    return (
      <div data-testid="pbis-collection-data">
        Collection Data: {collectionData?.id}
      </div>
    );
  };
});

jest.mock('../components/PBIS/PbisCardChart', () => {
  return function MockPbisCardChart({ cardCounts }: any) {
    return (
      <div data-testid="pbis-card-chart">
        Card Counts: {cardCounts?.length || 0}
      </div>
    );
  };
});

jest.mock('../components/PBIS/PbisFalcon', () => {
  return function MockPbisFalcon({ initialCount }: any) {
    return <div data-testid="pbis-falcon">Falcon - {initialCount} cards</div>;
  };
});

const { useUser } = require('../components/User');
const { useGQLQuery } = require('../lib/useGqlQuery');
const isAllowed = require('../lib/isAllowed');

describe('PbisPage', () => {
  const mockPbisPageProps = {
    totalSchoolCards: 5000,
    schoolWideCardsInCategories: [
      { word: 'respect', total: 1200 },
      { word: 'responsibility', total: 1100 },
      { word: 'perseverance', total: 900 },
      { word: 'quick', total: 800 },
      { word: 'physical', total: 600 },
      { word: 'class', total: 300 },
      { word: 'Chromebook Check', total: 100 },
    ],
    lastPbisCollection: {
      id: 'collection-1',
      collectionDate: '2024-01-15T00:00:00.000Z',
      taNewLevelWinners: [
        {
          id: 'teacher-1',
          name: 'Ms. Smith',
          taTeamPbisLevel: 3,
          taTeamAveragePbisCardsPerStudent: 15,
        },
      ],
      personalLevelWinners: [
        {
          id: 'student-1',
          name: 'John Doe',
          individualPbisLevel: 4,
        },
      ],
      randomDrawingWinners: [
        {
          id: 'winner-1',
          student: {
            id: 'student-2',
            name: 'Jane Smith',
            taTeacher: { name: 'Mr. Johnson' },
          },
        },
      ],
    },
    pbisLinks: [
      {
        id: 'link-1',
        link: 'https://example.com/pbis-resources',
        name: 'PBIS Resources',
        description: 'Helpful PBIS resources',
        forParents: true,
        forTeachers: true,
        forStudents: false,
      },
      {
        id: 'link-2',
        link: 'student-rewards.com',
        name: 'Student Rewards',
        description: 'Student reward ideas',
        forParents: false,
        forTeachers: false,
        forStudents: true,
      },
    ],
    TAs: [
      {
        id: 'ta-1',
        name: 'Ms. Johnson',
        taTeamPbisLevel: 2,
        taTeamAveragePbisCardsPerStudent: 12,
        taStudents: [
          {
            id: 'student-1',
            name: 'Alice Brown',
            studentPbisCardsCount: 85,
            uncountedCards: 5,
            individualPbisLevel: 3,
          },
          {
            id: 'student-2',
            name: 'Bob Wilson',
            studentPbisCardsCount: 65,
            uncountedCards: 3,
            individualPbisLevel: 2,
          },
        ],
      },
      {
        id: 'ta-2',
        name: 'Mr. Davis',
        taTeamPbisLevel: 1,
        taTeamAveragePbisCardsPerStudent: 8,
        taStudents: [
          {
            id: 'student-3',
            name: 'Carol White',
            studentPbisCardsCount: 40,
            uncountedCards: 2,
            individualPbisLevel: 1,
          },
        ],
      },
    ],
    cardCounts: [
      {
        id: 'count-1',
        collectionDate: '2024-01-01T00:00:00.000Z',
        collectedCards: 4500,
      },
      {
        id: 'count-2',
        collectionDate: '2024-01-15T00:00:00.000Z',
        collectedCards: 5000,
      },
    ],
  };

  const mockUserWithTeam = {
    ...mockUser,
    isStaff: true,
    taTeam: {
      id: 'team-1',
      teamName: 'Eagles',
    },
  };

  const mockUserWithTaTeacher = {
    ...mockUser,
    isStudent: true,
    taTeacher: {
      taTeam: {
        id: 'team-2',
        teamName: 'Hawks',
      },
    },
  };

  const mockTeamData = {
    totalTeamCards: 250,
    teamData: [
      {
        id: 'card-1',
        dateGiven: '2024-01-10T00:00:00.000Z',
        category: 'respect',
        counted: true,
      },
      {
        id: 'card-2',
        dateGiven: '2024-01-12T00:00:00.000Z',
        category: 'responsibility',
        counted: true,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    isAllowed.mockReturnValue(true);
  });

  it('renders school-wide PBIS data correctly', () => {
    useUser.mockReturnValue(mockUser);
    useGQLQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<PbisPage {...mockPbisPageProps} />);

    expect(screen.getByText('School-Wide PBIS Data')).toBeInTheDocument();
    expect(screen.getByText('School-Wide Cards: 5000')).toBeInTheDocument();
  });

  it('displays team data when user has a team', () => {
    useUser.mockReturnValue(mockUserWithTeam);
    useGQLQuery.mockReturnValue({
      data: mockTeamData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<PbisPage {...mockPbisPageProps} />);

    expect(screen.getByText('Total Team Cards: 250')).toBeInTheDocument();
  });

  it('displays team data for student with TA teacher', () => {
    useUser.mockReturnValue(mockUserWithTaTeacher);
    useGQLQuery.mockReturnValue({
      data: mockTeamData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<PbisPage {...mockPbisPageProps} />);

    expect(screen.getByText('Total Team Cards: 250')).toBeInTheDocument();
  });

  it('renders school-wide doughnut chart', () => {
    useUser.mockReturnValue(mockUser);
    useGQLQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<PbisPage {...mockPbisPageProps} />);

    const charts = screen.getAllByTestId('doughnut-chart');
    expect(charts.length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText('School-Wide Cards By Category'),
    ).toBeInTheDocument();
  });

  it('renders team doughnut chart when user has team', () => {
    useUser.mockReturnValue(mockUserWithTeam);
    useGQLQuery.mockReturnValue({
      data: mockTeamData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<PbisPage {...mockPbisPageProps} />);

    const charts = screen.getAllByTestId('doughnut-chart');
    expect(charts).toHaveLength(2);
    expect(screen.getByText('Eagles Cards By Category')).toBeInTheDocument();
  });

  it('renders PBIS falcon with correct count', () => {
    useUser.mockReturnValue(mockUser);
    useGQLQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<PbisPage {...mockPbisPageProps} />);

    expect(screen.getByTestId('pbis-falcon')).toBeInTheDocument();
    expect(screen.getByText('Falcon - 5000 cards')).toBeInTheDocument();
  });

  it('displays PBIS card chart', () => {
    useUser.mockReturnValue(mockUser);
    useGQLQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<PbisPage {...mockPbisPageProps} />);

    expect(screen.getByTestId('pbis-card-chart')).toBeInTheDocument();
    expect(screen.getByText('Card Counts: 2')).toBeInTheDocument();
  });

  it('displays collection data when available', () => {
    useUser.mockReturnValue(mockUser);
    useGQLQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<PbisPage {...mockPbisPageProps} />);

    expect(screen.getByTestId('pbis-collection-data')).toBeInTheDocument();
    expect(
      screen.getByText('Collection Data: collection-1'),
    ).toBeInTheDocument();
  });

  it('shows management links for users with canManagePbis permission', () => {
    const adminUser = {
      ...mockUser,
      canManagePbis: true,
    };
    useUser.mockReturnValue(adminUser);
    useGQLQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<PbisPage {...mockPbisPageProps} />);

    expect(
      screen.getByRole('link', { name: 'Weekly Reading' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Data Table' }),
    ).toBeInTheDocument();
  });

  it('shows staff links for staff users', () => {
    const staffUser = {
      ...mockUser,
      isStaff: true,
    };
    useUser.mockReturnValue(staffUser);
    useGQLQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<PbisPage {...mockPbisPageProps} />);

    expect(
      screen.getByRole('link', { name: 'Students of Interest' }),
    ).toBeInTheDocument();
  });

  it('filters and displays role-specific PBIS links', () => {
    const teacherUser = {
      ...mockUser,
      isStaff: true,
      isParent: false,
      isStudent: false,
    };
    useUser.mockReturnValue(teacherUser);
    useGQLQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<PbisPage {...mockPbisPageProps} />);

    // Should show teacher links
    expect(
      screen.getByRole('link', { name: 'PBIS Resources' }),
    ).toBeInTheDocument();
    // Should not show student links
    expect(
      screen.queryByRole('link', { name: 'Student Rewards' }),
    ).not.toBeInTheDocument();
  });

  it('displays student-specific links for students', () => {
    const studentUser = {
      ...mockUser,
      isStaff: false,
      isParent: false,
      isStudent: true,
    };
    useUser.mockReturnValue(studentUser);
    useGQLQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<PbisPage {...mockPbisPageProps} />);

    // Should show student links
    expect(
      screen.getByRole('link', { name: 'Student Rewards' }),
    ).toBeInTheDocument();
    // Should not show teacher-only links
    expect(
      screen.queryByRole('link', { name: 'PBIS Resources' }),
    ).not.toBeInTheDocument();
  });

  it('renders TA team data correctly', () => {
    useUser.mockReturnValue(mockUser);
    useGQLQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<PbisPage {...mockPbisPageProps} />);

    expect(screen.getByText('Current Team Data')).toBeInTheDocument();
    expect(screen.getByText('Ms. Johnson')).toBeInTheDocument();
    expect(screen.getByText('Level -2-')).toBeInTheDocument();
    expect(screen.getByText('12 cards per student')).toBeInTheDocument();
    expect(screen.getByText('Total of 2 students')).toBeInTheDocument();
  });

  it.skip('calculates uncounted cards correctly for TAs', () => {
    useUser.mockReturnValue(mockUser);
    useGQLQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<PbisPage {...mockPbisPageProps} />);

    // Ms. Johnson's team: 5 + 3 = 8 uncounted cards
    expect(screen.getByText('Uncounted cards: 8')).toBeInTheDocument();
    // Mr. Davis's team: 2 uncounted cards
    expect(screen.getByText('Uncounted cards: 2')).toBeInTheDocument();
  });

  it.skip('displays individual student data within TA teams', () => {
    useUser.mockReturnValue(mockUser);
    useGQLQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<PbisPage {...mockPbisPageProps} />);

    expect(screen.getByText(/Alice Brown:/)).toBeInTheDocument();
    expect(
      screen.getByText(/85 total, 5 uncounted, Level 3/),
    ).toBeInTheDocument();

    expect(screen.getByText(/Bob Wilson:/)).toBeInTheDocument();
    expect(
      screen.getByText(/65 total, 3 uncounted, Level 2/),
    ).toBeInTheDocument();

    expect(screen.getByText(/Carol White:/)).toBeInTheDocument();
    expect(
      screen.getByText(/40 total, 2 uncounted, Level 1/),
    ).toBeInTheDocument();
  });

  it('sorts TAs by team PBIS level', () => {
    useUser.mockReturnValue(mockUser);
    useGQLQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { container } = renderWithProviders(
      <PbisPage {...mockPbisPageProps} />,
    );

    const taNames = container.querySelectorAll('h3');
    const taNameTexts = Array.from(taNames).map((h3) => h3.textContent);

    // Mr. Davis (Level 1) should come before Ms. Johnson (Level 2)
    const davisIndex = taNameTexts.findIndex((name) =>
      name?.includes('Mr. Davis'),
    );
    const johnsonIndex = taNameTexts.findIndex((name) =>
      name?.includes('Ms. Johnson'),
    );

    expect(davisIndex).toBeLessThan(johnsonIndex);
  });

  it('handles external links correctly', () => {
    useUser.mockReturnValue({ ...mockUser, isStaff: true });
    useGQLQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<PbisPage {...mockPbisPageProps} />);

    const pbisResourcesLink = screen.getByRole('link', {
      name: 'PBIS Resources',
    });
    expect(pbisResourcesLink).toHaveAttribute(
      'href',
      'https://example.com/pbis-resources',
    );
    expect(pbisResourcesLink).toHaveAttribute('target', '_blank');
  });

  it('handles links without http protocol correctly', () => {
    const studentUser = {
      ...mockUser,
      isStudent: true,
    };
    useUser.mockReturnValue(studentUser);
    useGQLQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<PbisPage {...mockPbisPageProps} />);

    const studentRewardsLink = screen.getByRole('link', {
      name: 'Student Rewards',
    });
    expect(studentRewardsLink).toHaveAttribute(
      'href',
      'http://student-rewards.com',
    );
  });

  it('handles empty or null data gracefully', () => {
    useUser.mockReturnValue(mockUser);
    useGQLQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const emptyProps = {
      totalSchoolCards: 0,
      schoolWideCardsInCategories: [],
      lastPbisCollection: null,
      pbisLinks: [],
      TAs: [],
      cardCounts: [],
    };

    renderWithProviders(<PbisPage {...emptyProps} />);

    expect(screen.getByText(/School-Wide Cards:/)).toBeInTheDocument();
    expect(screen.getByText('Current Team Data')).toBeInTheDocument();
  });

  it('handles loading state appropriately', () => {
    useUser.mockReturnValue(mockUserWithTeam);
    useGQLQuery.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<PbisPage {...mockPbisPageProps} />);

    expect(
      screen.getByText('Total Team Cards: loading...'),
    ).toBeInTheDocument();
  });

  it('calculates team categories correctly from team data', () => {
    useUser.mockReturnValue(mockUserWithTeam);
    useGQLQuery.mockReturnValue({
      data: mockTeamData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const propsWithCategories = {
      ...mockPbisPageProps,
      categoriesArray: ['respect', 'responsibility', 'perseverance'],
    };

    renderWithProviders(<PbisPage {...propsWithCategories} />);

    // Should process team data to create category charts
    expect(screen.getByText('Eagles Cards By Category')).toBeInTheDocument();
  });

  it('enables query only when user and teamId are available', () => {
    const mockRefetch = jest.fn();

    useUser.mockReturnValue(null); // No user
    useGQLQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithProviders(<PbisPage {...mockPbisPageProps} />);

    // Query should be disabled when no user
    expect(useGQLQuery).toHaveBeenCalledWith(
      'PbisPageInfo',
      expect.any(Object),
      expect.any(Object),
      expect.objectContaining({
        enabled: false, // !!null && !!null = false
      }),
    );
  });

  it('excludes admin user from TA display', () => {
    const propsWithAdmin = {
      ...mockPbisPageProps,
      TAs: [
        ...mockPbisPageProps.TAs,
        {
          id: 'admin', // This should match the ADMIN_ID from our mock
          name: 'Admin User',
          taTeamPbisLevel: 5,
          taTeamAveragePbisCardsPerStudent: 20,
          taStudents: [
            {
              id: 'admin-student',
              name: 'Admin Student',
              studentPbisCardsCount: 100,
              uncountedCards: 0,
              individualPbisLevel: 5,
            },
          ],
        },
      ],
    };

    useUser.mockReturnValue(mockUser);
    useGQLQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<PbisPage {...propsWithAdmin} />);

    // Admin should not be displayed
    expect(screen.queryByText('Admin User')).not.toBeInTheDocument();
    // Other TAs should still be displayed
    expect(screen.getByText('Ms. Johnson')).toBeInTheDocument();
    expect(screen.getByText('Mr. Davis')).toBeInTheDocument();
  });
});
