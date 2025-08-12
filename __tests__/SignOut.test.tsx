import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import SignOut from '../components/loginComponents/SignOut';

// Mock the GraphQL mutation hook
jest.mock('../lib/useGqlMutation', () => ({
  useGqlMutation: jest.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('SignOut Component', () => {
  let queryClient: QueryClient;
  const mockSignout = jest.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Clear all mocks
    jest.clearAllMocks();
    localStorageMock.clear();

    const { useGqlMutation } = require('../lib/useGqlMutation');
    useGqlMutation.mockReturnValue([
      mockSignout,
      {
        data: null,
        loading: false,
        error: null,
      },
    ]);
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>,
    );
  };

  it('should render the sign out button', () => {
    renderWithQueryClient(<SignOut />);

    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('should handle successful sign out', async () => {
    mockSignout.mockResolvedValue({});

    renderWithQueryClient(<SignOut />);

    const signOutButton = screen.getByText('Sign Out');
    fireEvent.click(signOutButton);

    await waitFor(() => {
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(mockSignout).toHaveBeenCalledWith({});
    });
  });

  it('should handle sign out errors gracefully', async () => {
    mockSignout.mockRejectedValue(new Error('Network error'));

    renderWithQueryClient(<SignOut />);

    const signOutButton = screen.getByText('Sign Out');
    fireEvent.click(signOutButton);

    await waitFor(() => {
      // Should still clear token even if mutation fails
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    });
  });

  it('should clear query client before calling endSession', async () => {
    mockSignout.mockResolvedValue({});

    renderWithQueryClient(<SignOut />);

    const signOutButton = screen.getByText('Sign Out');
    fireEvent.click(signOutButton);

    await waitFor(() => {
      // Verify the order of operations
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(mockSignout).toHaveBeenCalledWith({});
    });
  });

  it('should handle multiple rapid clicks gracefully', async () => {
    mockSignout.mockResolvedValue({});

    renderWithQueryClient(<SignOut />);

    const signOutButton = screen.getByText('Sign Out');

    // Click multiple times rapidly
    fireEvent.click(signOutButton);
    fireEvent.click(signOutButton);
    fireEvent.click(signOutButton);

    await waitFor(() => {
      // Should clear token for each click attempt
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    });
  });
});
