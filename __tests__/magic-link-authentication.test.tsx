import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import MagicLinkSignIn from '../components/loginComponents/MagicLinkSignIn';
import SignInDialog from '../components/loginComponents/SignInDialog';
import { useUser } from '../components/User';
import LoginLink from '../pages/loginLink';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock the User hook
jest.mock('../components/User', () => ({
  useUser: jest.fn(),
}));

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

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;

describe('Magic Link Authentication Flow', () => {
  let queryClient: QueryClient;

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

    // Set up default mock for useGqlMutation
    const { useGqlMutation } = require('../lib/useGqlMutation');
    useGqlMutation.mockReturnValue([
      jest.fn(),
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

  describe('SignInDialog', () => {
    it('should render when user is not authenticated and dialog is open', () => {
      mockUseUser.mockReturnValue(undefined);

      renderWithQueryClient(<SignInDialog isOpen={true} />);

      expect(
        screen.getByText('Welcome to NCUJHS Dashboard'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Sign in to access your dashboard'),
      ).toBeInTheDocument();
      expect(screen.getByAltText('NCUJHS Falcon')).toBeInTheDocument();
    });

    it('should not render when user is authenticated', () => {
      mockUseUser.mockReturnValue({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      } as any);

      const { container } = renderWithQueryClient(
        <SignInDialog isOpen={true} />,
      );

      expect(container.firstChild).toBeNull();
    });

    it('should not render when dialog is not open', () => {
      mockUseUser.mockReturnValue(undefined);

      const { container } = renderWithQueryClient(
        <SignInDialog isOpen={false} />,
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('MagicLinkSignIn', () => {
    const mockSendMagicLink = jest.fn();

    beforeEach(() => {
      const { useGqlMutation } = require('../lib/useGqlMutation');
      useGqlMutation.mockReturnValue([
        mockSendMagicLink,
        {
          data: null,
          loading: false,
          error: null,
        },
      ]);
    });

    it('should render the sign-in form', () => {
      renderWithQueryClient(<MagicLinkSignIn />);

      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByText('Send Sign In Link')).toBeInTheDocument();
    });

    it('should handle form submission', async () => {
      mockSendMagicLink.mockResolvedValue({});

      renderWithQueryClient(<MagicLinkSignIn />);

      const emailInput = screen.getByLabelText('Email Address');
      const submitButton = screen.getByText('Send Sign In Link');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSendMagicLink).toHaveBeenCalledWith({
          email: 'test@example.com',
        });
      });
    });

    it('should show loading state during submission', () => {
      const { useGqlMutation } = require('../lib/useGqlMutation');
      useGqlMutation.mockReturnValue([
        mockSendMagicLink,
        {
          data: null,
          loading: true,
          error: null,
        },
      ]);

      renderWithQueryClient(<MagicLinkSignIn />);

      expect(screen.getByText('Sending...')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toBeDisabled();
    });

    it('should show success message after sending magic link', async () => {
      const { useGqlMutation } = require('../lib/useGqlMutation');
      useGqlMutation.mockReturnValue([
        mockSendMagicLink,
        {
          data: { sendUserMagicAuthLink: true },
          loading: false,
          error: null,
        },
      ]);

      renderWithQueryClient(<MagicLinkSignIn />);

      const emailInput = screen.getByLabelText('Email Address');
      const submitButton = screen.getByText('Send Sign In Link');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Check Your Email')).toBeInTheDocument();
        expect(
          screen.getByText(/We've sent a sign-in link to your email address/),
        ).toBeInTheDocument();
      });
    });

    it('should handle errors', () => {
      const { useGqlMutation } = require('../lib/useGqlMutation');
      useGqlMutation.mockReturnValue([
        mockSendMagicLink,
        {
          data: null,
          loading: false,
          error: new Error('Failed to send magic link'),
        },
      ]);

      renderWithQueryClient(<MagicLinkSignIn />);

      expect(screen.getByText('Failed to send magic link')).toBeInTheDocument();
    });
  });

  describe('LoginLink Page', () => {
    const mockMutation = jest.fn();
    const mockPush = jest.fn();

    beforeEach(() => {
      mockUseRouter.mockReturnValue({
        query: { token: 'test-token', email: 'test@example.com' },
        push: mockPush,
        pathname: '/loginLink',
      } as any);

      mockUseUser.mockReturnValue(undefined);

      const { useGqlMutation } = require('../lib/useGqlMutation');
      useGqlMutation.mockReturnValue([
        mockMutation,
        {
          data: null,
          loading: false,
          error: null,
        },
      ]);
    });

    it('should show loading state initially', () => {
      renderWithQueryClient(<LoginLink />);

      expect(
        screen.getByText('Verifying your sign-in link...'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Please wait while we authenticate you.'),
      ).toBeInTheDocument();
    });

    it('should call mutation with token and email', async () => {
      renderWithQueryClient(<LoginLink />);

      await waitFor(() => {
        expect(mockMutation).toHaveBeenCalledWith({
          token: 'test-token',
          email: 'test@example.com',
        });
      });
    });

    it('should show success state and store token', async () => {
      const { useGqlMutation } = require('../lib/useGqlMutation');
      useGqlMutation.mockReturnValue([
        mockMutation,
        {
          data: {
            redeemUserMagicAuthToken: {
              __typename: 'RedeemUserMagicAuthTokenSuccess',
              token: 'session-token',
              item: {
                name: 'Test User',
                email: 'test@example.com',
                id: '1',
              },
            },
          },
          loading: false,
          error: null,
        },
      ]);

      renderWithQueryClient(<LoginLink />);

      await waitFor(() => {
        expect(screen.getByText('Welcome back!')).toBeInTheDocument();
        expect(
          screen.getByText('Successfully signed in as Test User'),
        ).toBeInTheDocument();
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'token',
          'session-token',
        );
      });
    });

    it('should show error state for failed redemption', async () => {
      const { useGqlMutation } = require('../lib/useGqlMutation');
      useGqlMutation.mockReturnValue([
        mockMutation,
        {
          data: {
            redeemUserMagicAuthToken: {
              __typename: 'RedeemUserMagicAuthTokenFailure',
              message: 'Token has expired',
            },
          },
          loading: false,
          error: null,
        },
      ]);

      renderWithQueryClient(<LoginLink />);

      await waitFor(() => {
        expect(screen.getByText('Sign-in Failed')).toBeInTheDocument();
        expect(screen.getByText('Token has expired')).toBeInTheDocument();
      });
    });

    it('should redirect authenticated users', () => {
      mockUseUser.mockReturnValue({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      } as any);

      renderWithQueryClient(<LoginLink />);

      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('should show error for missing token/email', () => {
      mockUseRouter.mockReturnValue({
        query: {},
        push: mockPush,
        pathname: '/loginLink',
      } as any);

      renderWithQueryClient(<LoginLink />);

      expect(screen.getByText('Invalid Sign-in Link')).toBeInTheDocument();
      expect(
        screen.getByText(/The sign-in link you used is invalid or has expired/),
      ).toBeInTheDocument();
    });

    it('should handle loading state during mutation', () => {
      const { useGqlMutation } = require('../lib/useGqlMutation');
      useGqlMutation.mockReturnValue([
        mockMutation,
        {
          data: null,
          loading: true,
          error: null,
        },
      ]);

      renderWithQueryClient(<LoginLink />);

      expect(
        screen.getByText('Verifying your sign-in link...'),
      ).toBeInTheDocument();
    });
  });

  describe('GraphQL Client Authentication', () => {
    it('should include Authorization header when token exists', () => {
      localStorageMock.getItem.mockReturnValue('test-token');

      const { GraphQLClient } = require('../lib/graphqlClient');
      const client = new GraphQLClient('http://localhost:3000/api/graphql');

      // Mock fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve({ data: {} }),
      });

      client.request('query { test }');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/graphql',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      );
    });

    it('should clear token on 401 response', async () => {
      localStorageMock.getItem.mockReturnValue('test-token');

      const { GraphQLClient } = require('../lib/graphqlClient');
      const client = new GraphQLClient('http://localhost:3000/api/graphql');

      // Mock fetch to return 401
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      await expect(client.request('query { test }')).rejects.toThrow(
        'GraphQL request failed: Unauthorized',
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    });
  });
});
