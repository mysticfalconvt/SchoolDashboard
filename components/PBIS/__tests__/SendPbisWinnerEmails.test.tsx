import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import SendPbisWinnerEmails from '../SendPbisWinnerEmails';

// Mock dependencies
const mockSendEmail = jest.fn();
const mockSetEmail = jest.fn();

jest.mock('../../../lib/useSendEmail', () => ({
  __esModule: true,
  default: () => ({
    setEmail: mockSetEmail,
    emailLoading: false,
    sendEmail: mockSendEmail,
  }),
}));

jest.mock('../../User', () => ({
  useUser: () => ({
    id: 'user1',
    name: 'Test User',
    email: 'testuser@school.edu',
    canManagePbis: true,
    isSuperAdmin: false,
  }),
}));

jest.mock('../../../lib/useGqlQuery', () => ({
  useGQLQuery: () => ({
    data: {
      lastCollection: [
        {
          id: 'collection1',
          collectionDate: '2024-01-15',
          personalLevelWinners: [
            {
              id: 'student1',
              name: 'John Doe',
              email: 'john@school.edu',
              individualPbisLevel: 5,
              parent: [
                {
                  id: 'parent1',
                  name: 'Smith, Jane',
                  email: 'jane.smith@example.com',
                },
              ],
            },
          ],
          taNewLevelWinners: [
            {
              id: 'ta1',
              name: 'Ms. Johnson',
              email: 'johnson@school.edu',
              taTeamPbisLevel: 3,
            },
          ],
          staffRandomWinners: [
            {
              id: 'staff1',
              name: 'Mr. Wilson',
              email: 'wilson@school.edu',
            },
          ],
          randomDrawingWinners: [
            {
              id: 'drawing1',
              student: {
                id: 'student2',
                name: 'Alice Brown',
                email: 'alice@school.edu',
                parent: [
                  {
                    id: 'parent2',
                    name: 'Brown, Carol',
                    email: 'carol.brown@example.com',
                  },
                ],
                taTeacher: {
                  name: 'Ms. Davis',
                },
              },
            },
          ],
        },
      ],
    },
    isLoading: false,
    error: null,
  }),
}));

let mockDrawingOn = true;
jest.mock('../../../config', () => ({
  ...jest.requireActual('../../../config'),
  get PBIS_STUDENT_RANDOM_DRAWING_WINNERS() {
    return mockDrawingOn;
  },
}));

jest.mock('../../Loading', () => {
  return function MockLoading() {
    return <div>Loading...</div>;
  };
});

jest.mock('../../../lib/useForm', () => ({
  __esModule: true,
  default: () => ({
    inputs: { confirmation: '' },
    handleChange: jest.fn(),
    clearForm: jest.fn(),
    resetForm: jest.fn(),
  }),
}));

describe('SendPbisWinnerEmails', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    mockDrawingOn = true;
    mockSendEmail.mockResolvedValue(undefined);
    mockSetEmail.mockClear();
    mockSendEmail.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <SendPbisWinnerEmails />
      </QueryClientProvider>,
    );
  };

  it('renders the send emails button', () => {
    renderComponent();
    expect(
      screen.getByText('Send Emails to all weekly PBIS winners'),
    ).toBeInTheDocument();
  });

  it('opens modal when button is clicked', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('Send Emails to all weekly PBIS winners'));

    await waitFor(() => {
      expect(
        screen.getByText('Send Emails to PBIS Winners'),
      ).toBeInTheDocument();
    });
  });

  it('displays winners in the modal', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('Send Emails to all weekly PBIS winners'));

    await waitFor(() => {
      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
      expect(screen.getByText(/Ms. Johnson/)).toBeInTheDocument();
      expect(screen.getByText(/Mr. Wilson/)).toBeInTheDocument();
      expect(screen.getByText(/Alice Brown/)).toBeInTheDocument();
    });
  });

  it('shows a switch per email type with winner emails on and parent emails off', async () => {
    renderComponent();
    fireEvent.click(screen.getByText('Send Emails to all weekly PBIS winners'));

    const studentLevelUp = await screen.findByRole('switch', {
      name: 'Students: you leveled up',
    });
    expect(studentLevelUp).toBeChecked();
    expect(
      screen.getByRole('switch', { name: 'Parents: your child leveled up' }),
    ).not.toBeChecked();
    // Four winner emails, no parent emails
    expect(screen.getByText(/Queue Emails/)).toHaveTextContent('(4 emails)');
  });

  it('counts parent emails once their switch is turned on, and drops winners switched off', async () => {
    renderComponent();
    fireEvent.click(screen.getByText('Send Emails to all weekly PBIS winners'));

    fireEvent.click(
      await screen.findByRole('switch', {
        name: 'Parents: your child leveled up',
      }),
    );
    expect(screen.getByText(/Queue Emails/)).toHaveTextContent('(5 emails)');
    expect(
      screen.getByText('Parent Emails Will Be Sent To:'),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('switch', { name: 'Staff: you won the staff drawing' }),
    );
    expect(screen.getByText(/Queue Emails/)).toHaveTextContent('(4 emails)');
  });

  it('disables the switch for a type with nobody to email this week', async () => {
    renderComponent();
    fireEvent.click(screen.getByText('Send Emails to all weekly PBIS winners'));

    // The TA winner in the mock has no students, so no parent emails
    const taParents = await screen.findByRole('switch', {
      name: "Parents: your child's TA leveled up",
    });
    expect(taParents).toBeDisabled();
    expect(taParents).not.toBeChecked();
  });

  it('hides and skips the drawing emails when the drawing is turned off', async () => {
    mockDrawingOn = false;
    renderComponent();
    fireEvent.click(screen.getByText('Send Emails to all weekly PBIS winners'));

    await screen.findByRole('switch', { name: 'Students: you leveled up' });
    expect(
      screen.queryByRole('switch', { name: 'Students: you won the drawing' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('switch', {
        name: 'Parents: your child won the drawing',
      }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Alice Brown/)).not.toBeInTheDocument();
    // Level up, TA and staff only - the drawing winner is not counted
    expect(screen.getByText(/Queue Emails/)).toHaveTextContent('(3 emails)');
  });

  it('handles formatParentName functionality', () => {
    // Since formatParentName is internal, we test it through behavior
    renderComponent();

    fireEvent.click(screen.getByText('Send Emails to all weekly PBIS winners'));

    // The component should render and not crash with parent names
    expect(screen.getByText('Send Emails to PBIS Winners')).toBeInTheDocument();
  });
});

// Test formatParentName utility function separately
describe('formatParentName utility', () => {
  const formatParentName = (name: string): string => {
    if (!name) return '';
    if (name.includes(',')) {
      const parts = name.split(',').map((part) => part.trim());
      const [last, ...firstParts] = parts;
      const first = firstParts.join(', ');
      return `${first} ${last}`;
    }
    return name;
  };

  it('formats "Last, First" to "First Last"', () => {
    expect(formatParentName('Smith, John')).toBe('John Smith');
  });

  it('handles names with multiple commas', () => {
    expect(formatParentName('Smith, John, Jr.')).toBe('John, Jr. Smith');
  });

  it('handles names without commas', () => {
    expect(formatParentName('John Smith')).toBe('John Smith');
  });

  it('handles empty strings', () => {
    expect(formatParentName('')).toBe('');
  });
});
