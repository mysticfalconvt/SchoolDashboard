import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, mockUser } from '../../../__tests__/utils/test-utils';
import PbisWidget from '../PbisWidget';

// Mock the User hook
jest.mock('../../User', () => ({
  useUser: jest.fn(),
}));

// Mock PbisFalcon component
jest.mock('../PbisFalcon', () => {
  return function MockPbisFalcon({ initialCount }: any) {
    return (
      <div data-testid="pbis-falcon">
        Falcon Animation - {initialCount}
      </div>
    );
  };
});

const { useUser } = require('../../User');

describe('PbisWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders PBIS widget for staff users', () => {
    const staffUser = {
      ...mockUser,
      isStaff: true,
      isStudent: false,
      teacherPbisCardCount: 25,
      teacherYearPbisCount: 150,
    };
    useUser.mockReturnValue(staffUser);

    renderWithProviders(<PbisWidget />);

    expect(screen.getByText('Week - 25')).toBeInTheDocument();
    expect(screen.getByText('Year - 150')).toBeInTheDocument();
    expect(screen.getByTestId('pbis-falcon')).toBeInTheDocument();
  });

  it('renders PBIS widget for student users', () => {
    const studentUser = {
      ...mockUser,
      isStaff: false,
      isStudent: true,
      PbisCardCount: 30,
      YearPbisCount: 200,
      studentPbisCards: [],
    };
    useUser.mockReturnValue(studentUser);

    renderWithProviders(<PbisWidget />);

    expect(screen.getByText('Week - 30')).toBeInTheDocument();
    expect(screen.getByText('Year - 200')).toBeInTheDocument();
    expect(screen.getByTestId('pbis-falcon')).toBeInTheDocument();
  });

  it('renders only falcon when user is not staff or student', () => {
    const parentUser = {
      ...mockUser,
      isStaff: false,
      isStudent: false,
      isParent: true,
    };
    useUser.mockReturnValue(parentUser);

    renderWithProviders(<PbisWidget />);

    expect(screen.getByTestId('pbis-falcon')).toBeInTheDocument();
    expect(screen.queryByText(/Week -/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Year -/)).not.toBeInTheDocument();
  });

  it('handles undefined user gracefully', () => {
    useUser.mockReturnValue(undefined);

    renderWithProviders(<PbisWidget />);

    expect(screen.getByTestId('pbis-falcon')).toBeInTheDocument();
    expect(screen.queryByText(/Week -/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Year -/)).not.toBeInTheDocument();
  });

  it('handles null user gracefully', () => {
    useUser.mockReturnValue(null);

    renderWithProviders(<PbisWidget />);

    expect(screen.getByTestId('pbis-falcon')).toBeInTheDocument();
    expect(screen.queryByText(/Week -/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Year -/)).not.toBeInTheDocument();
  });

  it('prioritizes staff data when user is both staff and student', () => {
    const staffStudentUser = {
      ...mockUser,
      isStaff: true,
      isStudent: true,
      teacherPbisCardCount: 40, // Staff data
      teacherYearPbisCount: 180,
      PbisCardCount: 20, // Student data
      YearPbisCount: 100,
      studentPbisCards: [],
    };
    useUser.mockReturnValue(staffStudentUser);

    renderWithProviders(<PbisWidget />);

    // Should show staff data (40, 180) not student data (20, 100)
    expect(screen.getByText('Week - 40')).toBeInTheDocument();
    expect(screen.getByText('Year - 180')).toBeInTheDocument();
  });

  it('renders with zero PBIS count', () => {
    const staffUserWithZeroCards = {
      ...mockUser,
      isStaff: true,
      isStudent: false,
      teacherPbisCardCount: 0,
      teacherYearPbisCount: 0,
    };
    useUser.mockReturnValue(staffUserWithZeroCards);

    renderWithProviders(<PbisWidget />);

    expect(screen.getByText('Week - 0')).toBeInTheDocument();
    expect(screen.getByText('Year - 0')).toBeInTheDocument();
  });

  it('handles missing PBIS count gracefully', () => {
    const staffUserWithoutCount = {
      ...mockUser,
      isStaff: true,
      isStudent: false,
      teacherPbisCardCount: undefined,
      teacherYearPbisCount: undefined,
    };
    useUser.mockReturnValue(staffUserWithoutCount);

    renderWithProviders(<PbisWidget />);

    expect(screen.getByText('Week - 0')).toBeInTheDocument();
    expect(screen.getByText('Year - 0')).toBeInTheDocument();
  });

  it('renders correctly when user data changes', async () => {
    const { rerender } = renderWithProviders(<PbisWidget />);

    // Start with staff user
    const staffUser = {
      ...mockUser,
      isStaff: true,
      isStudent: false,
      teacherPbisCardCount: 25,
      teacherYearPbisCount: 150,
    };
    useUser.mockReturnValue(staffUser);
    rerender(<PbisWidget />);

    expect(screen.getByText('Week - 25')).toBeInTheDocument();
    expect(screen.getByText('Year - 150')).toBeInTheDocument();

    // Change to student user
    const studentUser = {
      ...mockUser,
      isStaff: false,
      isStudent: true,
      PbisCardCount: 35,
      YearPbisCount: 180,
      studentPbisCards: [],
    };
    useUser.mockReturnValue(studentUser);
    rerender(<PbisWidget />);

    await waitFor(() => {
      expect(screen.getByText('Week - 35')).toBeInTheDocument();
      expect(screen.getByText('Year - 180')).toBeInTheDocument();
    });
  });

  it('handles teacher who is also a student', () => {
    const teacherStudent = {
      ...mockUser,
      isStaff: true,
      isStudent: true,
      isTeacher: true,
      teacherPbisCardCount: 15,
      teacherYearPbisCount: 90,
      PbisCardCount: 25, // Student data should be ignored
      YearPbisCount: 130,
      studentPbisCards: [],
    };
    useUser.mockReturnValue(teacherStudent);

    renderWithProviders(<PbisWidget />);

    // Should show staff data since isStaff takes precedence
    expect(screen.getByText('Week - 15')).toBeInTheDocument();
    expect(screen.getByText('Year - 90')).toBeInTheDocument();
  });
});