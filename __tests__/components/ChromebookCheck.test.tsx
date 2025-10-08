import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChromebookCheck from '../../components/Chromebooks/ChromebookCheck';
import {
  sendBulkChromebookEmails,
  sendChromebookCheckEmails,
} from '../../lib/chromebookEmailUtils';

// Mock the utility function
jest.mock('../../lib/chromebookEmailUtils', () => ({
  sendChromebookCheckEmails: jest.fn(),
  sendBulkChromebookEmails: jest.fn(),
  chromebookEmails: [
    'robert.boskind@ncsuvt.org',
    'Joyce.Lantagne@ncsuvt.org',
    'katlynn.cochran@ncsuvt.org',
  ],
}));

// Mock the GraphQL hooks
jest.mock('../../lib/useGqlMutation', () => ({
  useGqlMutation: jest.fn(() => [jest.fn(), { loading: false }]),
}));

jest.mock('../../lib/useGqlQuery', () => ({
  useGQLQuery: jest.fn(() => ({
    data: {
      user: {
        id: 'teacher1',
        name: 'Ms. Teacher',
        taStudents: [
          {
            id: 'student1',
            name: 'John Doe',
            email: 'john.doe@example.com',
            parent: [
              {
                id: 'parent1',
                name: 'Smith, Jane',
                email: 'jane.smith@example.com',
              },
            ],
          },
          {
            id: 'student2',
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            parent: [],
          },
        ],
      },
    },
    isLoading: false,
  })),
}));

// Mock the useForm hook
jest.mock('../../lib/useForm', () => ({
  useForm: jest.fn(() => ({
    inputs: {},
    handleInputChange: jest.fn(),
    handleSubmit: jest.fn(),
    isSubmitting: false,
    message: '',
    customMessage: '',
  })),
}));

// Mock the email hook
jest.mock('../../lib/useSendEmail', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    sendEmail: jest.fn(),
    emailLoading: false,
  })),
}));

// Mock the user hook
jest.mock('../../components/User', () => ({
  useUser: jest.fn(() => ({
    id: 'teacher1',
    name: 'Ms. Teacher',
    email: 'teacher@school.com',
    canManagePbis: true,
  })),
}));

// Mock react-query
jest.mock('react-query', () => ({
  useQueryClient: jest.fn(() => ({
    refetchQueries: jest.fn(),
  })),
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

describe('ChromebookCheck', () => {
  const mockSendChromebookCheckEmails =
    sendChromebookCheckEmails as jest.MockedFunction<
      typeof sendChromebookCheckEmails
    >;
  const mockSendBulkChromebookEmails =
    sendBulkChromebookEmails as jest.MockedFunction<
      typeof sendBulkChromebookEmails
    >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the TA Chromebook Checks button', () => {
    render(<ChromebookCheck />);
    expect(
      screen.getByText(/TA Chromebook Checks \(2 students\)/),
    ).toBeInTheDocument();
  });

  it('should open the dialog when button is clicked', async () => {
    const user = userEvent.setup();
    render(<ChromebookCheck />);

    const button = screen.getByText(/TA Chromebook Checks \(2 students\)/);
    await user.click(button);

    expect(screen.getByText('Chromebook Checks')).toBeInTheDocument();
    expect(
      screen.getByText('Submit chromebook checks for your TA students'),
    ).toBeInTheDocument();
  });

  it('should display student names in the dialog in Last, First format', async () => {
    const user = userEvent.setup();
    render(<ChromebookCheck />);

    const button = screen.getByText(/TA Chromebook Checks \(2 students\)/);
    await user.click(button);

    expect(screen.getByText('Doe, John')).toBeInTheDocument();
    expect(screen.getByText('Smith, Jane')).toBeInTheDocument();
  });

  it('should show progress bar when sending emails', async () => {
    const user = userEvent.setup();
    mockSendChromebookCheckEmails.mockImplementation(async ({ onProgress }) => {
      if (onProgress) {
        onProgress({ sent: 1, total: 5 });
        onProgress({ sent: 2, total: 5 });
        onProgress({ sent: 3, total: 5 });
        onProgress({ sent: 4, total: 5 });
        onProgress({ sent: 5, total: 5 });
      }
      // Add a small delay to allow progress to be visible
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    render(<ChromebookCheck />);

    const button = screen.getByText(/TA Chromebook Checks \(2 students\)/);
    await user.click(button);

    // Change status to "Something wrong" and add details
    const statusSelects = screen.getAllByRole('combobox');
    await user.selectOptions(statusSelects[0], 'Something wrong');

    const detailsInputs = screen.getAllByPlaceholderText(
      'Describe the issue...',
    );
    await user.type(detailsInputs[0], 'Broken screen');

    // Find the first student's submit button and click it
    const submitButtons = screen.getAllByText('Submit');
    await user.click(submitButtons[0]);

    // Wait for the progress bar to appear
    await waitFor(
      () => {
        expect(screen.getByText(/Sending emails.../)).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    expect(screen.getByText(/5 \/ 5 emails sent/)).toBeInTheDocument();
  });

  it('should disable buttons while sending emails', async () => {
    const user = userEvent.setup();
    mockSendChromebookCheckEmails.mockImplementation(async () => {
      // Simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    render(<ChromebookCheck />);

    const button = screen.getByText(/TA Chromebook Checks \(2 students\)/);
    await user.click(button);

    // Change status to "Something wrong" and add details
    const statusSelects = screen.getAllByRole('combobox');
    await user.selectOptions(statusSelects[0], 'Something wrong');

    const detailsInputs = screen.getAllByPlaceholderText(
      'Describe the issue...',
    );
    await user.type(detailsInputs[0], 'Broken screen');

    const submitButtons = screen.getAllByText('Submit');
    const submitAllButton = screen.getByText('Submit All');
    const closeButton = screen.getByText('Close');

    // Click submit to start email sending
    await user.click(submitButtons[0]);

    // Wait for buttons to be disabled
    await waitFor(() => {
      expect(submitButtons[0]).toBeDisabled();
      expect(submitAllButton).toBeDisabled();
      expect(closeButton).toBeDisabled();
    });
  });

  it('should call sendChromebookCheckEmails with correct parameters', async () => {
    const user = userEvent.setup();
    render(<ChromebookCheck />);

    const button = screen.getByText(/TA Chromebook Checks \(2 students\)/);
    await user.click(button);

    // Change status to "Something wrong" and add details
    const statusSelects = screen.getAllByRole('combobox');
    await user.selectOptions(statusSelects[0], 'Something wrong');

    const detailsInputs = screen.getAllByPlaceholderText(
      'Describe the issue...',
    );
    await user.type(detailsInputs[0], 'Broken screen');

    // Submit the check
    const submitButtons = screen.getAllByText('Submit');
    await user.click(submitButtons[0]);

    await waitFor(() => {
      expect(mockSendChromebookCheckEmails).toHaveBeenCalledWith({
        student: expect.objectContaining({
          id: 'student1',
          name: 'John Doe',
          email: 'john.doe@example.com',
        }),
        teacherName: 'Ms. Teacher',
        teacherEmail: 'teacher@school.com',
        issueDetails: 'Broken screen',
        sendEmail: expect.any(Function),
        onProgress: expect.any(Function),
      });
    });
  });

  it('should not send emails for "Everything good" status', async () => {
    const user = userEvent.setup();
    render(<ChromebookCheck />);

    const button = screen.getByText(/TA Chromebook Checks \(2 students\)/);
    await user.click(button);

    // Keep status as "Everything good" (default)
    const submitButtons = screen.getAllByText('Submit');
    await user.click(submitButtons[0]);

    // Wait a bit to ensure no emails are sent
    await waitFor(() => {
      expect(mockSendChromebookCheckEmails).not.toHaveBeenCalled();
    });
  });

  it('should handle submit all functionality', async () => {
    const user = userEvent.setup();
    render(<ChromebookCheck />);

    const button = screen.getByText(/TA Chromebook Checks \(2 students\)/);
    await user.click(button);

    // Change both students to "Something wrong"
    const statusSelects = screen.getAllByRole('combobox');
    await user.selectOptions(statusSelects[0], 'Something wrong'); // First student
    await user.selectOptions(statusSelects[1], 'Something wrong'); // Second student

    const detailsInputs = screen.getAllByPlaceholderText(
      'Describe the issue...',
    );
    await user.type(detailsInputs[0], 'Broken screen');
    await user.type(detailsInputs[1], 'Missing charger');

    // Submit all
    const submitAllButton = screen.getByText('Submit All');
    await user.click(submitAllButton);

    await waitFor(() => {
      expect(mockSendBulkChromebookEmails).toHaveBeenCalledTimes(1);
    });
  });

  it('should close dialog after emails are sent', async () => {
    const user = userEvent.setup();
    render(<ChromebookCheck />);

    const button = screen.getByText(/TA Chromebook Checks \(2 students\)/);
    await user.click(button);

    // Change status and submit
    const statusSelects = screen.getAllByRole('combobox');
    await user.selectOptions(statusSelects[0], 'Something wrong');

    const detailsInputs = screen.getAllByPlaceholderText(
      'Describe the issue...',
    );
    await user.type(detailsInputs[0], 'Broken screen');

    const submitButtons = screen.getAllByText('Submit');
    await user.click(submitButtons[0]);

    // Wait for dialog to close
    await waitFor(
      () => {
        expect(screen.queryByText('Chromebook Checks')).not.toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it('should show correct email count in progress', async () => {
    const user = userEvent.setup();
    mockSendChromebookCheckEmails.mockImplementation(async ({ onProgress }) => {
      if (onProgress) {
        onProgress({ sent: 1, total: 5 });
        onProgress({ sent: 2, total: 5 });
        onProgress({ sent: 3, total: 5 });
        onProgress({ sent: 4, total: 5 });
        onProgress({ sent: 5, total: 5 });
      }
      // Add a small delay to allow progress to be visible
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    render(<ChromebookCheck />);

    const button = screen.getByText(/TA Chromebook Checks \(2 students\)/);
    await user.click(button);

    // Change status to "Something wrong" and add details
    const statusSelects = screen.getAllByRole('combobox');
    await user.selectOptions(statusSelects[0], 'Something wrong');

    const detailsInputs = screen.getAllByPlaceholderText(
      'Describe the issue...',
    );
    await user.type(detailsInputs[0], 'Broken screen');

    const submitButtons = screen.getAllByText('Submit');
    await user.click(submitButtons[0]);

    await waitFor(
      () => {
        expect(
          screen.getByText(/Sending emails... 5 \/ 5 emails sent/),
        ).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it('should handle students without email addresses', async () => {
    const user = userEvent.setup();

    // Mock a student without email
    const mockUseGQLQuery = require('../../lib/useGqlQuery').useGQLQuery;
    mockUseGQLQuery.mockReturnValue({
      data: {
        user: {
          id: 'teacher1',
          name: 'Ms. Teacher',
          taStudents: [
            {
              id: 'student1',
              name: 'John Doe',
              email: undefined, // No email
              parent: [
                {
                  id: 'parent1',
                  name: 'Smith, Jane',
                  email: 'jane.smith@example.com',
                },
              ],
            },
          ],
        },
      },
      isLoading: false,
    });

    render(<ChromebookCheck />);

    const button = screen.getByText(/TA Chromebook Checks \(1 students\)/);
    await user.click(button);

    const statusSelects = screen.getAllByRole('combobox');
    await user.selectOptions(statusSelects[0], 'Something wrong');

    const detailsInputs = screen.getAllByPlaceholderText(
      'Describe the issue...',
    );
    await user.type(detailsInputs[0], 'Broken screen');

    const submitButtons = screen.getAllByText('Submit');
    await user.click(submitButtons[0]);

    await waitFor(() => {
      expect(mockSendChromebookCheckEmails).toHaveBeenCalledWith({
        student: expect.objectContaining({
          email: undefined,
        }),
        teacherName: 'Ms. Teacher',
        teacherEmail: 'teacher@school.com',
        issueDetails: 'Broken screen',
        sendEmail: expect.any(Function),
        onProgress: expect.any(Function),
      });
    });
  });
});
