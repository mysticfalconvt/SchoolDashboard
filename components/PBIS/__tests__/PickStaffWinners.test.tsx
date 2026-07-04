import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import PickStaffWinners from '../PickStaffWinners';

// Mock dependencies
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
  // Both the collections query and the staff-cards query read from this single
  // mocked object (each picks the field it needs).
  useGQLQuery: () => ({
    data: {
      pbisCollectionDates: [
        {
          id: 'collection1',
          collectionDate: '2024-01-15',
          staffRandomWinners: [
            { id: 'staff1', name: 'John Teacher', email: 'john@school.edu' },
          ],
        },
      ],
      // Staff cards given since the last collection (one ticket per card).
      // staff1 is a previous winner and should be excluded.
      staffPbisCards: [
        {
          id: 'c1',
          recipient: { id: 'staff2', name: 'Jane Coach', email: 'jane@school.edu' },
        },
        {
          id: 'c2',
          recipient: {
            id: 'staff3',
            name: 'Bob Principal',
            email: 'bob@school.edu',
          },
        },
        {
          id: 'c3',
          recipient: {
            id: 'staff1',
            name: 'John Teacher',
            email: 'john@school.edu',
          },
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
    inputs: { confirmation: '', numberOfWinners: 5 },
    handleChange: jest.fn(),
    clearForm: jest.fn(),
    resetForm: jest.fn(),
  }),
}));

jest.mock('../../../lib/graphqlClient', () => ({
  GraphQLClient: jest.fn(() => ({
    request: jest.fn().mockResolvedValue({ success: true }),
  })),
}));

describe('PickStaffWinners', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <PickStaffWinners />
      </QueryClientProvider>,
    );
  };

  it('renders the pick staff winners button', () => {
    renderComponent();
    expect(screen.getByText('Pick Staff winners')).toBeInTheDocument();
  });

  it('opens modal when button is clicked', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('Pick Staff winners'));

    await waitFor(() => {
      expect(screen.getByText('Pick Random Staff Winners')).toBeInTheDocument();
    });
  });

  it('displays available staff excluding previous winners', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('Pick Staff winners'));

    await waitFor(() => {
      // Should show staff who haven't won (staff2, staff3)
      expect(screen.getByText(/Jane Coach/)).toBeInTheDocument();
      expect(screen.getByText(/Bob Principal/)).toBeInTheDocument();

      // Should NOT show previous winner (staff1) in the available staff list
      // Note: John Teacher will appear in the warning message, but not in the available staff list
      const availableStaffSection = screen
        .getByText(
          'Eligible Staff (received cards this period, not previously won):',
        )
        .closest('div');
      expect(availableStaffSection).not.toContainElement(
        screen.queryByText(/John Teacher/),
      );
    });
  });

  it('has default number of winners input', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('Pick Staff winners'));

    await waitFor(() => {
      expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    });
  });

  it('closes modal when X button is clicked', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('Pick Staff winners'));

    await waitFor(() => {
      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      expect(
        screen.queryByText('Pick Random Staff Winners'),
      ).not.toBeInTheDocument();
    });
  });

  it('displays warning when there are existing staff winners', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('Pick Staff winners'));

    await waitFor(() => {
      // Should show warning about existing winners
      expect(
        screen.getByText('⚠️ Warning: Staff winners already selected'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /There are already staff winners selected for the latest PBIS collection/,
        ),
      ).toBeInTheDocument();
      expect(screen.getByText(/not replace them/)).toBeInTheDocument();

      // Should show existing winner in the warning
      expect(screen.getByText(/John Teacher/)).toBeInTheDocument();
      expect(screen.getByText(/john@school.edu/)).toBeInTheDocument();

      // Winners must be previewed before they can be saved
      expect(screen.getByText('Preview winners first')).toBeInTheDocument();
    });
  });
});
