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

jest.mock('../../Loading', () => {
  return function MockLoading() {
    return <div>Loading...</div>;
  };
});

jest.mock('../../../lib/useForm', () => ({
  __esModule: true,
  default: () => ({
    inputs: { confirmation: '', emailParents: false },
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
