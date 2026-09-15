import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useUser } from '../components/User';
import { useGQLQuery } from '../lib/useGqlQuery';
import PbisStats from '../pages/PbisStats';
import { mockUser, renderWithProviders } from './utils/test-utils';

jest.mock('../components/User', () => ({
  useUser: jest.fn(),
}));

jest.mock('../lib/useGqlQuery', () => ({
  useGQLQuery: jest.fn(),
}));

jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="line-chart" />,
}));

const mockedUseUser = useUser as jest.Mock;
const mockedUseGQLQuery = useGQLQuery as jest.Mock;

const students = [
  {
    id: 'student-1',
    name: 'Student One',
    YearPbisCount: 10,
    Last7DaysPbisCount: 2,
    Last30DaysPbisCount: 6,
    block1Teacher: { id: 'teacher-1', name: 'Teacher One' },
    block9Teacher: { id: 'teacher-1', name: 'Teacher One' },
  },
  {
    id: 'student-2',
    name: 'Student Two',
    YearPbisCount: 0,
    Last7DaysPbisCount: 0,
    Last30DaysPbisCount: 2,
    block12Teacher: { id: 'teacher-1', name: 'Teacher One' },
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseUser.mockReturnValue({
    ...mockUser,
    canManagePbis: true,
  });
  mockedUseGQLQuery.mockImplementation((key: string) => ({
    data: key === 'pbisStudentStats' ? { students } : null,
    isLoading: false,
    error: null,
  }));
});

describe('PBIS Stats', () => {
  it('summarizes current-year student recognition', () => {
    renderWithProviders(<PbisStats />);

    expect(screen.getByRole('heading', { name: 'PBIS Stats' })).toBeInTheDocument();
    expect(screen.getByText('10', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getAllByText('5', { selector: 'p' })).toHaveLength(2);
    expect(screen.getByText('50%', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText('1 recognized, 1 with no cards')).toBeInTheDocument();
  });

  it('explains and displays deduplicated teacher student data', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PbisStats />);

    await user.click(
      screen.getByRole('button', { name: 'Student Distribution' }),
    );

    expect(
      screen.getByText(/not a ranking of cards given by each teacher/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Teacher One' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '2' })).toBeInTheDocument();
  });

  it('switches student distribution periods without another query', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PbisStats />);

    await user.click(
      screen.getByRole('button', { name: 'Student Distribution' }),
    );
    await user.click(screen.getByRole('button', { name: 'Last 30 Days' }));

    expect(screen.getAllByRole('cell', { name: '4' })).toHaveLength(2);
    expect(screen.getByRole('cell', { name: '2' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Last 7 Days' }));

    expect(screen.getAllByRole('cell', { name: '1' })).toHaveLength(3);
  });

  it('blocks users without PBIS reporting access', () => {
    mockedUseUser.mockReturnValue(mockUser);

    renderWithProviders(<PbisStats />);

    expect(
      screen.getByText('You are not authorized to view this page.'),
    ).toBeInTheDocument();
  });

  it('keeps cards without a teacher in activity totals', async () => {
    const dateGiven = new Date().toISOString();
    mockedUseGQLQuery.mockImplementation((key: string) => ({
      data:
        key === 'pbisCardEntries'
          ? {
              pbisCards: [
                {
                  id: 'card-1',
                  dateGiven,
                  teacher: { id: 'teacher-1', name: 'Teacher One' },
                },
                { id: 'card-2', dateGiven, teacher: null },
              ],
            }
          : key === 'pbisStudentStats'
            ? { students }
            : null,
      isLoading: false,
      error: null,
    }));
    const user = userEvent.setup();
    renderWithProviders(<PbisStats />);

    await user.click(screen.getByRole('button', { name: 'Card Activity' }));
    await user.click(screen.getByRole('button', { name: 'Teacher Summary' }));

    expect(screen.getByText('Cards Recorded')).toBeInTheDocument();
    expect(
      screen.getByRole('cell', { name: 'Unknown / system giver' }),
    ).toBeInTheDocument();
  });
});
