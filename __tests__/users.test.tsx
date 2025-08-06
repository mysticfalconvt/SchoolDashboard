import { fireEvent, screen, waitFor } from '@testing-library/react';
import UsersPage from '../pages/users';
import { mockUser, renderWithProviders } from './utils/test-utils';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    query: {},
    pathname: '/users',
    route: '/users',
    asPath: '/users',
  }),
}));

// Mock dependencies
jest.mock('../components/User', () => ({
  useUser: jest.fn(),
}));

jest.mock('../lib/useGqlQuery', () => ({
  useGQLQuery: jest.fn(),
}));

jest.mock('../components/Table', () => {
  return function MockTable({ data, columns, searchColumn }: any) {
    return (
      <div data-testid="users-table">
        <div data-testid="search-column">{searchColumn}</div>
        <div data-testid="data-length">{data?.length || 0}</div>
        {data?.map((item: any, index: number) => (
          <div key={item.id || index} data-testid={`user-row-${index}`}>
            <span data-testid={`user-name-${index}`}>{item.name}</span>
            <span data-testid={`user-pbis-${index}`}>
              {item.YearPbisCount || 0}
            </span>
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('../lib/isAllowed', () => jest.fn());

const { useUser } = require('../components/User');
const { useGQLQuery } = require('../lib/useGqlQuery');
const isAllowed = require('../lib/isAllowed');

describe('UsersPage', () => {
  const mockStudents = [
    {
      id: 'student-1',
      name: 'Alice Johnson',
      preferredName: 'Ali',
      taTeacher: { id: 'teacher-1', name: 'Mr. Smith' },
      callbackCount: 2,
      YearPbisCount: 150,
      averageTimeToCompleteCallback: 3.5,
      individualPbisLevel: 5,
      callbackItemsCount: 1,
    },
    {
      id: 'student-2',
      name: 'Bob Wilson',
      preferredName: null,
      taTeacher: { id: 'teacher-2', name: 'Ms. Johnson' },
      callbackCount: 1,
      YearPbisCount: 75,
      averageTimeToCompleteCallback: 2.1,
      individualPbisLevel: 3,
      callbackItemsCount: 0,
    },
  ];

  const mockTeachers = [
    {
      id: 'teacher-1',
      name: 'Mr. Smith',
      hasTA: true,
      callbackCount: 5,
      virtualCards: 45,
      averageTimeToCompleteCallback: 1.5,
      callbackAssignedCount: 2,
      totalCallback: 5,
      YearPbisCount: 200,
    },
    {
      id: 'teacher-2',
      name: 'Ms. Johnson',
      hasTA: false,
      callbackCount: 3,
      virtualCards: 30,
      averageTimeToCompleteCallback: 2.0,
      callbackAssignedCount: 1,
      totalCallback: 3,
      YearPbisCount: 150,
    },
  ];

  const mockProps = {
    students: { students: mockStudents },
    teachers: { teachers: mockTeachers },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useUser.mockReturnValue(mockUser);
    isAllowed.mockReturnValue(true);
    useGQLQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });
  });

  it('renders access denied when user lacks permissions', () => {
    const nonStaffUser = {
      ...mockUser,
      isStaff: false,
    };
    useUser.mockReturnValue(nonStaffUser);

    renderWithProviders(<UsersPage {...mockProps} />);

    expect(screen.getByText('User does not have access')).toBeInTheDocument();
  });

  it('renders students view by default', () => {
    useGQLQuery.mockReturnValue({
      data: { students: mockStudents },
      isLoading: false,
      error: null,
    });

    renderWithProviders(<UsersPage {...mockProps} />);

    expect(screen.getByTestId('users-table')).toBeInTheDocument();
    expect(screen.getByTestId('data-length')).toHaveTextContent('2');
  });

  it('switches to teachers view when button is clicked', async () => {
    useGQLQuery.mockReturnValue({
      data: { teachers: mockTeachers },
      isLoading: false,
      error: null,
    });

    renderWithProviders(<UsersPage {...mockProps} />);

    const teachersButton = screen.getByText('Show Teachers');
    fireEvent.click(teachersButton);

    await waitFor(() => {
      expect(screen.getByTestId('data-length')).toHaveTextContent('2');
    });
  });

  it('displays correct search column', () => {
    useGQLQuery.mockReturnValue({
      data: { students: mockStudents },
      isLoading: false,
      error: null,
    });

    renderWithProviders(<UsersPage {...mockProps} />);

    expect(screen.getByTestId('search-column')).toHaveTextContent('name');
  });

  it('handles empty students data', () => {
    useGQLQuery.mockReturnValue({
      data: { students: [] },
      isLoading: false,
      error: null,
    });

    renderWithProviders(<UsersPage {...mockProps} />);

    expect(screen.getByTestId('data-length')).toHaveTextContent('0');
  });

  it('handles null user gracefully', () => {
    useUser.mockReturnValue(null);

    renderWithProviders(<UsersPage {...mockProps} />);

    expect(screen.getByText('User does not have access')).toBeInTheDocument();
  });
});
