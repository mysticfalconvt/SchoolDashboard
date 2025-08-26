import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateSingleChromebookCheck from '../../components/Chromebooks/CreateSingleChromebookCheck';
import { sendChromebookCheckEmails } from '../../lib/chromebookEmailUtils';

// Mock the utility function
jest.mock('../../lib/chromebookEmailUtils', () => ({
  sendChromebookCheckEmails: jest.fn(),
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
  })),
}));

// Mock the SearchForUserName component
jest.mock('../../components/SearchForUserName', () => {
  return function MockSearchForUserName({
    updateUser,
  }: {
    updateUser: (user: any) => void;
  }) {
    const mockReact = require('react');
    mockReact.useEffect(() => {
      // Simulate selecting a student
      updateUser({
        userId: 'student1',
        userName: 'John Doe',
      });
    }, [updateUser]);

    return mockReact.createElement(
      'div',
      { 'data-testid': 'search-for-user' },
      'Search Component',
    );
  };
});

describe('CreateSingleChromebookCheck', () => {
  const mockSendChromebookCheckEmails =
    sendChromebookCheckEmails as jest.MockedFunction<
      typeof sendChromebookCheckEmails
    >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the Chromebook Check button', () => {
    render(<CreateSingleChromebookCheck />);
    expect(screen.getByText('Chromebook Check')).toBeInTheDocument();
  });

  it('should open the form when button is clicked', async () => {
    const user = userEvent.setup();
    render(<CreateSingleChromebookCheck />);

    const button = screen.getByText('Chromebook Check');
    await user.click(button);

    expect(screen.getAllByText('Create Chromebook Check')).toHaveLength(2); // Heading and button
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('should display the search component in the form', async () => {
    const user = userEvent.setup();
    render(<CreateSingleChromebookCheck />);

    const button = screen.getByText('Chromebook Check');
    await user.click(button);

    expect(screen.getByTestId('search-for-user')).toBeInTheDocument();
  });

  it('should show progress bar when sending emails', async () => {
    const user = userEvent.setup();
    mockSendChromebookCheckEmails.mockImplementation(async ({ onProgress }) => {
      if (onProgress) {
        onProgress({ sent: 1, total: 5 });
        await new Promise((resolve) => setTimeout(resolve, 50));
        onProgress({ sent: 2, total: 5 });
        await new Promise((resolve) => setTimeout(resolve, 50));
        onProgress({ sent: 3, total: 5 });
        await new Promise((resolve) => setTimeout(resolve, 50));
        onProgress({ sent: 4, total: 5 });
        await new Promise((resolve) => setTimeout(resolve, 50));
        onProgress({ sent: 5, total: 5 });
      }
      // Add a small delay to allow progress to be visible
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    render(<CreateSingleChromebookCheck />);

    const button = screen.getByText('Chromebook Check');
    await user.click(button);

    // Wait for student to be selected
    await waitFor(() => {
      expect(screen.getByTestId('search-for-user')).toBeInTheDocument();
    });

    // Status should already be "Something wrong" by default, so we can add details
    const detailsInput = screen.getByPlaceholderText('Describe the issue...');
    await user.type(detailsInput, 'Broken screen');

    // Submit the check
    const submitButtons = screen.getAllByText('Create Chromebook Check');
    const submitButton = submitButtons.find(
      (button) => button.tagName === 'BUTTON',
    );
    await user.click(submitButton!);

    // Wait for the progress bar to appear
    await waitFor(
      () => {
        expect(screen.getByText(/Sending emails.../)).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    // Wait for the final progress state
    await waitFor(
      () => {
        expect(screen.getByText(/5 \/ 5 emails sent/)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it('should disable buttons while sending emails', async () => {
    const user = userEvent.setup();
    mockSendChromebookCheckEmails.mockImplementation(async () => {
      // Simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    render(<CreateSingleChromebookCheck />);

    const button = screen.getByText('Chromebook Check');
    await user.click(button);

    // Wait for student to be selected
    await waitFor(() => {
      expect(screen.getByTestId('search-for-user')).toBeInTheDocument();
    });

    const detailsInput = screen.getByPlaceholderText('Describe the issue...');
    await user.type(detailsInput, 'Broken screen');

    const submitButtons = screen.getAllByText('Create Chromebook Check');
    const submitButton = submitButtons.find(
      (button) => button.tagName === 'BUTTON',
    );
    const cancelButton = screen.getByText('Close');

    // Click submit to start email sending
    await user.click(submitButton!);

    // Wait for buttons to be disabled
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });
  });

  it('should call sendChromebookCheckEmails with correct parameters', async () => {
    const user = userEvent.setup();
    render(<CreateSingleChromebookCheck />);

    const button = screen.getByText('Chromebook Check');
    await user.click(button);

    // Wait for student to be selected
    await waitFor(() => {
      expect(screen.getByTestId('search-for-user')).toBeInTheDocument();
    });

    // Status should already be "Something wrong" by default, so we can add details
    const detailsInput = screen.getByPlaceholderText('Describe the issue...');
    await user.type(detailsInput, 'Broken screen');

    // Submit the check
    const submitButtons = screen.getAllByText('Create Chromebook Check');
    const submitButton = submitButtons.find(
      (button) => button.tagName === 'BUTTON',
    );
    await user.click(submitButton!);

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
    render(<CreateSingleChromebookCheck />);

    const button = screen.getByText('Chromebook Check');
    await user.click(button);

    // Wait for student to be selected
    await waitFor(() => {
      expect(screen.getByTestId('search-for-user')).toBeInTheDocument();
    });

    // Keep status as "Everything good" (default)
    const submitButtons = screen.getAllByText('Create Chromebook Check');
    const submitButton = submitButtons.find(
      (button) => button.tagName === 'BUTTON',
    );
    await user.click(submitButton!);

    // Wait a bit to ensure no emails are sent
    await waitFor(() => {
      expect(mockSendChromebookCheckEmails).not.toHaveBeenCalled();
    });
  });

  it('should close form after emails are sent', async () => {
    const user = userEvent.setup();
    render(<CreateSingleChromebookCheck />);

    const button = screen.getByText('Chromebook Check');
    await user.click(button);

    // Wait for student to be selected
    await waitFor(() => {
      expect(screen.getByTestId('search-for-user')).toBeInTheDocument();
    });

    // Change status and submit
    const detailsInput = screen.getByPlaceholderText('Describe the issue...');
    await user.type(detailsInput, 'Broken screen');

    const submitButtons = screen.getAllByText('Create Chromebook Check');
    const submitButton = submitButtons.find(
      (button) => button.tagName === 'BUTTON',
    );
    await user.click(submitButton!);

    // Wait for form to close
    await waitFor(
      () => {
        expect(
          screen.queryByText('Create Chromebook Check'),
        ).not.toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it('should show correct email count in progress', async () => {
    const user = userEvent.setup();
    mockSendChromebookCheckEmails.mockImplementation(async ({ onProgress }) => {
      if (onProgress) {
        onProgress({ sent: 1, total: 5 });
        await new Promise((resolve) => setTimeout(resolve, 50));
        onProgress({ sent: 2, total: 5 });
        await new Promise((resolve) => setTimeout(resolve, 50));
        onProgress({ sent: 3, total: 5 });
        await new Promise((resolve) => setTimeout(resolve, 50));
        onProgress({ sent: 4, total: 5 });
        await new Promise((resolve) => setTimeout(resolve, 50));
        onProgress({ sent: 5, total: 5 });
      }
      // Add a small delay to allow progress to be visible
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    render(<CreateSingleChromebookCheck />);

    const button = screen.getByText('Chromebook Check');
    await user.click(button);

    // Wait for student to be selected
    await waitFor(() => {
      expect(screen.getByTestId('search-for-user')).toBeInTheDocument();
    });

    const detailsInput = screen.getByPlaceholderText('Describe the issue...');
    await user.type(detailsInput, 'Broken screen');

    const submitButtons = screen.getAllByText('Create Chromebook Check');
    const submitButton = submitButtons.find(
      (button) => button.tagName === 'BUTTON',
    );
    await user.click(submitButton!);

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
      },
      isLoading: false,
    });

    render(<CreateSingleChromebookCheck />);

    const button = screen.getByText('Chromebook Check');
    await user.click(button);

    // Wait for student to be selected
    await waitFor(() => {
      expect(screen.getByTestId('search-for-user')).toBeInTheDocument();
    });

    const detailsInput = screen.getByPlaceholderText('Describe the issue...');
    await user.type(detailsInput, 'Broken screen');

    const submitButtons = screen.getAllByText('Create Chromebook Check');
    const submitButton = submitButtons.find(
      (button) => button.tagName === 'BUTTON',
    );
    await user.click(submitButton!);

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

  it('should handle students without parents', async () => {
    const user = userEvent.setup();

    // Mock a student without parents
    const mockUseGQLQuery = require('../../lib/useGqlQuery').useGQLQuery;
    mockUseGQLQuery.mockReturnValue({
      data: {
        user: {
          id: 'student1',
          name: 'John Doe',
          email: 'john.doe@example.com',
          parent: [], // No parents
        },
      },
      isLoading: false,
    });

    render(<CreateSingleChromebookCheck />);

    const button = screen.getByText('Chromebook Check');
    await user.click(button);

    // Wait for student to be selected
    await waitFor(() => {
      expect(screen.getByTestId('search-for-user')).toBeInTheDocument();
    });

    const detailsInput = screen.getByPlaceholderText('Describe the issue...');
    await user.type(detailsInput, 'Broken screen');

    const submitButtons = screen.getAllByText('Create Chromebook Check');
    const submitButton = submitButtons.find(
      (button) => button.tagName === 'BUTTON',
    );
    await user.click(submitButton!);

    await waitFor(() => {
      expect(mockSendChromebookCheckEmails).toHaveBeenCalledWith({
        student: expect.objectContaining({
          parent: [],
        }),
        teacherName: 'Ms. Teacher',
        teacherEmail: 'teacher@school.com',
        issueDetails: 'Broken screen',
        sendEmail: expect.any(Function),
        onProgress: expect.any(Function),
      });
    });
  });

  it('should close form when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<CreateSingleChromebookCheck />);

    const button = screen.getByText('Chromebook Check');
    await user.click(button);

    // Wait for student to be selected
    await waitFor(() => {
      expect(screen.getByTestId('search-for-user')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Close');
    await user.click(cancelButton);

    // Form should close
    expect(
      screen.queryByText('Create Chromebook Check'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Chromebook Check')).toBeInTheDocument();
  });
});
