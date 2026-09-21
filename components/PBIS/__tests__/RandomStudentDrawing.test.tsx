import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../__tests__/utils/test-utils';
import { useGQLQuery } from '../../../lib/useGqlQuery';
import RandomStudentDrawing, { uniqueStudents } from '../RandomStudentDrawing';

jest.mock('../../../lib/useGqlQuery', () => ({
  useGQLQuery: jest.fn(),
}));

const mockedUseGQLQuery = useGQLQuery as jest.Mock;

describe('RandomStudentDrawing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseGQLQuery.mockReturnValue({
      data: {
        staffPbisCards: [
          {
            id: 'staff-card-1',
            giver: {
              id: 'student-1',
              name: 'Alex Adams',
              isStudent: true,
              taTeacher: { name: 'Ms. Green' },
            },
          },
          {
            id: 'staff-card-2',
            giver: {
              id: 'student-1',
              name: 'Alex Adams',
              isStudent: true,
              taTeacher: { name: 'Ms. Green' },
            },
          },
          {
            id: 'staff-card-3',
            giver: { id: 'staff-1', name: 'Staff Person', isStudent: false },
          },
        ],
        pbisCards: [
          {
            id: 'pbis-card-1',
            student: { id: 'student-2', name: 'Bailey Brown', isStudent: true },
            teacher: { id: 'staff-2', isStaff: true },
          },
          {
            id: 'pbis-card-2',
            student: { id: 'student-3', name: 'Casey Clark', isStudent: true },
            teacher: { id: 'not-staff', isStaff: false },
          },
        ],
      },
      isLoading: false,
      error: null,
    });
  });

  it('deduplicates students in a drawing pool', () => {
    expect(
      uniqueStudents([
        { id: '2', name: 'Bailey' },
        { id: '1', name: 'Alex' },
        { id: '2', name: 'Bailey' },
      ]).map((student) => student.name),
    ).toEqual(['Alex', 'Bailey']);
  });

  it('defaults to student staff-card givers over the last two weeks', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RandomStudentDrawing />);

    await user.click(screen.getByRole('button', { name: 'Random Student' }));

    expect(screen.getByText('Time range: last 2 weeks')).toBeInTheDocument();
    expect(screen.getByText('1 student is in the pool')).toBeInTheDocument();
    expect(screen.getByText('Gave a staff card')).toHaveClass('font-bold');
    expect(mockedUseGQLQuery).toHaveBeenLastCalledWith(
      'randomStudentDrawingPool',
      expect.anything(),
      expect.objectContaining({ since: expect.any(String) }),
      expect.objectContaining({ enabled: true }),
    );
  });

  it('switches to students who received a regular card from staff', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RandomStudentDrawing />);
    await user.click(screen.getByRole('button', { name: 'Random Student' }));

    await user.click(screen.getByRole('switch', { name: 'Student pool type' }));

    expect(screen.getByText('Received a PBIS card')).toHaveClass('font-bold');
    expect(screen.getByText('1 student is in the pool')).toBeInTheDocument();
  });

  it('updates the range and displays a selected winner', async () => {
    const user = userEvent.setup();
    jest.spyOn(Math, 'random').mockReturnValue(0);
    renderWithProviders(<RandomStudentDrawing />);
    await user.click(screen.getByRole('button', { name: 'Random Student' }));

    fireEvent.change(screen.getByRole('slider'), { target: { value: '4' } });
    expect(screen.getByText('Time range: last 4 weeks')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Choose Winner' }));
    expect(screen.getByText('Alex Adams')).toBeInTheDocument();
    expect(screen.getByText('TA: Ms. Green')).toBeInTheDocument();

    jest.restoreAllMocks();
  });
});
