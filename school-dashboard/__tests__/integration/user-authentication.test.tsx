import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, mockUser } from '../utils/test-utils';
import { useUser } from '../../components/User';

// Integration test for user authentication flow
jest.mock('../../components/User');
jest.mock('../../lib/useGqlQuery', () => ({
  useGQLQuery: jest.fn(),
}));

const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;
const { useGQLQuery } = require('../../lib/useGqlQuery');

// Mock a simple component that uses authentication
const AuthenticatedComponent = () => {
  const user = useUser();

  if (!user) {
    return <div data-testid="loading">Loading...</div>;
  }

  return (
    <div data-testid="authenticated-content">
      <h1>Welcome, {user.name}!</h1>
      <div data-testid="user-permissions">
        {user.canManageUsers && <span data-testid="can-manage-users">Can manage users</span>}
        {user.canManageCalendar && <span data-testid="can-manage-calendar">Can manage calendar</span>}
        {user.isTeacher && <span data-testid="is-teacher">Teacher</span>}
        {user.isStudent && <span data-testid="is-student">Student</span>}
        {user.hasTA && <span data-testid="has-ta">Has TA</span>}
      </div>
      <div data-testid="pbis-count">{user.PbisCardCount} PBIS Cards</div>
    </div>
  );
};

describe('User Authentication Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useGQLQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });
  });

  it('shows loading state when user is not loaded', () => {
    mockUseUser.mockReturnValue(undefined);

    renderWithProviders(<AuthenticatedComponent />);

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.queryByTestId('authenticated-content')).not.toBeInTheDocument();
  });

  it('displays user information when authenticated', async () => {
    mockUseUser.mockReturnValue(mockUser);

    renderWithProviders(<AuthenticatedComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('authenticated-content')).toBeInTheDocument();
    });

    expect(screen.getByText('Welcome, Test User!')).toBeInTheDocument();
    expect(screen.getByTestId('pbis-count')).toHaveTextContent('25 PBIS Cards');
  });

  it('displays correct permissions for teacher user', async () => {
    const teacherUser = {
      ...mockUser,
      canManageUsers: false,
      canManageCalendar: true,
      isTeacher: true,
      isStudent: false,
      hasTA: true,
    };
    mockUseUser.mockReturnValue(teacherUser);

    renderWithProviders(<AuthenticatedComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('authenticated-content')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('can-manage-users')).not.toBeInTheDocument();
    expect(screen.getByTestId('can-manage-calendar')).toBeInTheDocument();
    expect(screen.getByTestId('is-teacher')).toBeInTheDocument();
    expect(screen.queryByTestId('is-student')).not.toBeInTheDocument();
    expect(screen.getByTestId('has-ta')).toBeInTheDocument();
  });

  it('displays correct permissions for student user', async () => {
    const studentUser = {
      ...mockUser,
      canManageUsers: false,
      canManageCalendar: false,
      isTeacher: false,
      isStudent: true,
      hasTA: false,
      PbisCardCount: 50,
    };
    mockUseUser.mockReturnValue(studentUser);

    renderWithProviders(<AuthenticatedComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('authenticated-content')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('can-manage-users')).not.toBeInTheDocument();
    expect(screen.queryByTestId('can-manage-calendar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('is-teacher')).not.toBeInTheDocument();
    expect(screen.getByTestId('is-student')).toBeInTheDocument();
    expect(screen.queryByTestId('has-ta')).not.toBeInTheDocument();
    expect(screen.getByTestId('pbis-count')).toHaveTextContent('50 PBIS Cards');
  });

  it('displays correct permissions for admin user', async () => {
    const adminUser = {
      ...mockUser,
      canManageUsers: true,
      canManageCalendar: true,
      canManagePbis: true,
      canSeeAllCallback: true,
      isSuperAdmin: true,
    };
    mockUseUser.mockReturnValue(adminUser);

    renderWithProviders(<AuthenticatedComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('authenticated-content')).toBeInTheDocument();
    });

    expect(screen.getByTestId('can-manage-users')).toBeInTheDocument();
    expect(screen.getByTestId('can-manage-calendar')).toBeInTheDocument();
  });

  it('handles user data updates', async () => {
    // Start with basic user
    mockUseUser.mockReturnValue(mockUser);

    const { rerender } = renderWithProviders(<AuthenticatedComponent />);

    await waitFor(() => {
      expect(screen.getByText('Welcome, Test User!')).toBeInTheDocument();
    });

    // Update user with more permissions
    const updatedUser = {
      ...mockUser,
      canManageUsers: true,
      PbisCardCount: 100,
    };
    mockUseUser.mockReturnValue(updatedUser);

    rerender(<AuthenticatedComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('can-manage-users')).toBeInTheDocument();
      expect(screen.getByTestId('pbis-count')).toHaveTextContent('100 PBIS Cards');
    });
  });

  it('handles authentication state changes', async () => {
    // Start unauthenticated
    mockUseUser.mockReturnValue(undefined);

    const { rerender } = renderWithProviders(<AuthenticatedComponent />);

    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Simulate successful authentication
    mockUseUser.mockReturnValue(mockUser);
    rerender(<AuthenticatedComponent />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      expect(screen.getByTestId('authenticated-content')).toBeInTheDocument();
    });

    // Simulate logout
    mockUseUser.mockReturnValue(undefined);
    rerender(<AuthenticatedComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.queryByTestId('authenticated-content')).not.toBeInTheDocument();
    });
  });

  it('maintains user state consistency', async () => {
    const consistentUser = {
      ...mockUser,
      name: 'Consistent User',
      email: 'consistent@example.com',
      isTeacher: true,
      canManageCalendar: true,
      PbisCardCount: 75,
    };

    mockUseUser.mockReturnValue(consistentUser);

    renderWithProviders(<AuthenticatedComponent />);

    await waitFor(() => {
      expect(screen.getByText('Welcome, Consistent User!')).toBeInTheDocument();
      expect(screen.getByTestId('is-teacher')).toBeInTheDocument();
      expect(screen.getByTestId('can-manage-calendar')).toBeInTheDocument();
      expect(screen.getByTestId('pbis-count')).toHaveTextContent('75 PBIS Cards');
    });

    // All user data should be consistent across renders
    const userElement = screen.getByText('Welcome, Consistent User!');
    const teacherElement = screen.getByTestId('is-teacher');
    const calendarElement = screen.getByTestId('can-manage-calendar');
    const pbisElement = screen.getByTestId('pbis-count');

    expect(userElement).toBeInTheDocument();
    expect(teacherElement).toBeInTheDocument();
    expect(calendarElement).toBeInTheDocument();
    expect(pbisElement).toBeInTheDocument();
  });
});