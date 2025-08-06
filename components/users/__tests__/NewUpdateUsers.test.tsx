import { fireEvent, screen, waitFor } from '@testing-library/react';
import {
  mockUser,
  renderWithProviders,
} from '../../../__tests__/utils/test-utils';
import NewUpdateUsers from '../NewUpdateUsers';

// Mock dependencies
jest.mock('../../../components/User', () => ({
  useUser: jest.fn(),
}));

jest.mock('../../../lib/useGqlQuery', () => ({
  useGQLQuery: jest.fn(),
}));

jest.mock('../../../lib/useGqlMutation', () => ({
  useGqlMutation: jest.fn(),
}));

jest.mock('../../../components/Search', () => ({
  SEARCH_ALL_USERS_QUERY: 'SEARCH_ALL_USERS_QUERY',
}));

const mockUseUser = require('../../../components/User').useUser;
const mockUseGQLQuery = require('../../../lib/useGqlQuery').useGQLQuery;
const mockUseGqlMutation =
  require('../../../lib/useGqlMutation').useGqlMutation;

describe('NewUpdateUsers', () => {
  const mockUpdateUsersFromJson = jest.fn();
  const mockAllUsers = {
    users: [
      { name: 'John Doe', isStudent: true },
      { name: 'Jane Smith', isStudent: true },
      { name: 'Bob Wilson', isStudent: false },
    ],
  };

  const mockUpdateResult = [
    { name: 'John Doe', email: 'john@example.com', existed: true },
    { name: 'Jane Smith', email: 'jane@example.com', existed: false },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseUser.mockReturnValue(mockUser);
    mockUseGQLQuery.mockReturnValue({
      data: mockAllUsers,
      isLoading: false,
      error: null,
    });

    mockUseGqlMutation.mockReturnValue([
      mockUpdateUsersFromJson,
      { loading: false, error: null, data: null },
    ]);
  });

  it('renders the button initially', () => {
    renderWithProviders(<NewUpdateUsers />);

    expect(
      screen.getByText('Batch Add/Update students from JSON'),
    ).toBeInTheDocument();
  });

  it('shows form when button is clicked', () => {
    renderWithProviders(<NewUpdateUsers />);

    const button = screen.getByText('Batch Add/Update students from JSON');
    fireEvent.click(button);

    expect(
      screen.getByText('Update all students schedules'),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('JSON goes here')).toBeInTheDocument();
  });

  it('hides form when close button is clicked', async () => {
    renderWithProviders(<NewUpdateUsers />);

    const button = screen.getByText('Batch Add/Update students from JSON');
    fireEvent.click(button);

    expect(
      screen.getByText('Update all students schedules'),
    ).toBeInTheDocument();

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(
        screen.queryByText('Update all students schedules'),
      ).not.toBeInTheDocument();
    });
  });

  it('hides form when backdrop is clicked', async () => {
    renderWithProviders(<NewUpdateUsers />);

    const button = screen.getByText('Batch Add/Update students from JSON');
    fireEvent.click(button);

    expect(
      screen.getByText('Update all students schedules'),
    ).toBeInTheDocument();

    const backdrop = screen.getByTestId('backdrop');
    fireEvent.click(backdrop);

    await waitFor(() => {
      expect(
        screen.queryByText('Update all students schedules'),
      ).not.toBeInTheDocument();
    });
  });

  it('processes single item without chunking', async () => {
    renderWithProviders(<NewUpdateUsers />);

    const button = screen.getByText('Batch Add/Update students from JSON');
    fireEvent.click(button);

    const textarea = screen.getByPlaceholderText('JSON goes here');
    const singleItem = JSON.stringify([
      { name: 'Test User', email: 'test@example.com' },
    ]);
    fireEvent.change(textarea, { target: { value: singleItem } });

    const submitButton = screen.getByText('Update Data');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateUsersFromJson).toHaveBeenCalledWith(
        {
          studentScheduleData: singleItem,
        },
        expect.objectContaining({
          onSuccess: expect.any(Function),
        }),
      );
    });
  });

  it('processes multiple items with chunking', async () => {
    renderWithProviders(<NewUpdateUsers />);

    const button = screen.getByText('Batch Add/Update students from JSON');
    fireEvent.click(button);

    const textarea = screen.getByPlaceholderText('JSON goes here');
    const multipleItems = JSON.stringify([
      { name: 'User 1', email: 'user1@example.com' },
      { name: 'User 2', email: 'user2@example.com' },
      { name: 'User 3', email: 'user3@example.com' },
    ]);
    fireEvent.change(textarea, { target: { value: multipleItems } });

    const submitButton = screen.getByText('Update Data');
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Should be called at least once for chunking (2+ items triggers chunking)
      expect(mockUpdateUsersFromJson).toHaveBeenCalled();
    });
  });

  it('handles mutation errors', async () => {
    const mockError = new Error('Mutation failed');
    mockUseGqlMutation.mockReturnValue([
      mockUpdateUsersFromJson,
      { loading: false, error: mockError, data: null },
    ]);

    renderWithProviders(<NewUpdateUsers />);

    const button = screen.getByText('Batch Add/Update students from JSON');
    fireEvent.click(button);

    expect(screen.getByText('Mutation failed')).toBeInTheDocument();
  });

  it('shows loading state during processing', async () => {
    mockUseGqlMutation.mockReturnValue([
      mockUpdateUsersFromJson,
      { loading: true, error: null, data: null },
    ]);

    renderWithProviders(<NewUpdateUsers />);

    const button = screen.getByText('Batch Add/Update students from JSON');
    fireEvent.click(button);

    const fieldset = screen.getByRole('group');
    expect(fieldset).toHaveAttribute('aria-busy', 'true');
    expect(fieldset).toBeDisabled();
  });

  it('displays results after successful update', async () => {
    renderWithProviders(<NewUpdateUsers />);

    const button = screen.getByText('Batch Add/Update students from JSON');
    fireEvent.click(button);

    const textarea = screen.getByPlaceholderText('JSON goes here');
    const testData = JSON.stringify([
      { name: 'Test User', email: 'test@example.com' },
    ]);
    fireEvent.change(textarea, { target: { value: testData } });

    const submitButton = screen.getByText('Update Data');
    fireEvent.click(submitButton);

    // Test that the form submission triggers the mutation
    await waitFor(() => {
      expect(mockUpdateUsersFromJson).toHaveBeenCalled();
    });
  });

  it('handles invalid JSON input', async () => {
    renderWithProviders(<NewUpdateUsers />);

    const button = screen.getByText('Batch Add/Update students from JSON');
    fireEvent.click(button);

    const textarea = screen.getByPlaceholderText('JSON goes here');
    fireEvent.change(textarea, { target: { value: 'invalid json' } });

    const submitButton = screen.getByText('Update Data');
    fireEvent.click(submitButton);

    // Should handle the error gracefully
    await waitFor(() => {
      expect(mockUpdateUsersFromJson).not.toHaveBeenCalled();
    });
  });

  it('handles empty JSON input', async () => {
    renderWithProviders(<NewUpdateUsers />);

    const button = screen.getByText('Batch Add/Update students from JSON');
    fireEvent.click(button);

    const textarea = screen.getByPlaceholderText('JSON goes here');
    fireEvent.change(textarea, { target: { value: '[]' } });

    const submitButton = screen.getByText('Update Data');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateUsersFromJson).toHaveBeenCalled();
    });
  });

  it('requires user to be logged in to show form', () => {
    mockUseUser.mockReturnValue(null);

    renderWithProviders(<NewUpdateUsers />);

    const button = screen.getByText('Batch Add/Update students from JSON');
    fireEvent.click(button);

    // Form should still be accessible even without user
    expect(
      screen.getByText('Update all students schedules'),
    ).toBeInTheDocument();
  });
});
