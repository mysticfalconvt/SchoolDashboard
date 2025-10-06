import { useUser } from '@/components/User';
import { useGqlMutation } from '@/lib/useGqlMutation';
import gql from 'graphql-tag';
import { useRouter } from 'next/router';
import * as React from 'react';
import { useQueryClient } from 'react-query';
import useSendEmail from '../lib/useSendEmail';

const LOGIN_LINK_MUTATION = gql`
  mutation LOGIN_LINK_MUTATION($token: String!, $email: String!) {
    redeemUserMagicAuthToken(email: $email, token: $token) {
      ... on RedeemUserMagicAuthTokenSuccess {
        token
        item {
          name
          email
          id
        }
      }
      ... on RedeemUserMagicAuthTokenFailure {
        code
        message
      }
    }
  }
`;



export default function LoginLink() {
  const router = useRouter();
  const token = router.query.token as string;
  const email = router.query.email as string;
  const user = useUser();
  const [mutation, { data, loading, error }] =
    useGqlMutation(LOGIN_LINK_MUTATION);
  const queryClient = useQueryClient();
  const { sendEmail } = useSendEmail();
  const [hasAttemptedMutation, setHasAttemptedMutation] = React.useState(false);
  const [mutationError, setMutationError] = React.useState<string | null>(null);
  const [timeoutReached, setTimeoutReached] = React.useState(false);
  const [hasReportedError, setHasReportedError] = React.useState(false);

  // Function to report login errors automatically
  const reportLoginError = React.useCallback(async (errorType: string, errorDetails: string) => {
    if (hasReportedError) return; // Prevent duplicate reports

    try {
      setHasReportedError(true);

      // Send email notification (simplified - just email, no bug reports or messages to avoid permission issues)
      const emailData = {
        toAddress: 'rboskind@gmail.com',
        fromAddress: 'system@ncujhs.tech',
        subject: `Magic Link Authentication Issue - ${errorType}`,
        body: `
          <h2>Magic Link Authentication Issue</h2>
          <p><strong>Error Type:</strong> ${errorType}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Token (first 10 chars):</strong> ${token?.substring(0, 10)}...</p>
          <p><strong>Error Details:</strong> ${errorDetails}</p>
          <p><strong>User Agent:</strong> ${navigator.userAgent}</p>
          <p><strong>URL:</strong> ${window.location.href}</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        `,
      };

      try {
        sendEmail({ emailData });
      } catch (emailError) {
        console.error('Failed to send error report email:', emailError);
      }

    } catch (reportError) {
      console.error('Failed to report login error:', reportError);
    }
  }, [hasReportedError, email, token, sendEmail]);

  React.useEffect(() => {
    // In test environment, router.isReady might be undefined, so we treat it as ready if token/email exist
    const isRouterReady = router.isReady !== false && (token || email || router.isReady);

    if (token && email && !data && !loading && !hasAttemptedMutation && isRouterReady) {
      setHasAttemptedMutation(true);
      mutation({
        token,
        email,
      });
    }
  }, [token, email, data, mutation, loading, hasAttemptedMutation, router.isReady, reportLoginError]);

  // Handle GraphQL errors
  React.useEffect(() => {
    if (error) {
      console.error('Magic link mutation error:', error);
      const errorMessage = error.message || 'An unexpected error occurred';
      setMutationError(errorMessage);
      reportLoginError('Network/GraphQL Error', errorMessage);
    }
  }, [error, reportLoginError]);

  // Add timeout to prevent infinite loading
  React.useEffect(() => {
    if (hasAttemptedMutation && !data && !error && !mutationError) {
      const timeout = setTimeout(() => {
        setTimeoutReached(true);
        const timeoutMessage = 'The request is taking longer than expected. Please try again.';
        setMutationError(timeoutMessage);
        reportLoginError('Timeout', timeoutMessage);
      }, 30000); // 30 second timeout

      return () => clearTimeout(timeout);
    }
  }, [hasAttemptedMutation, data, error, mutationError, reportLoginError]);

  // Check for unexpected response types
  React.useEffect(() => {
    if (data && data.redeemUserMagicAuthToken) {
      const response = data.redeemUserMagicAuthToken;
      const typename = response.__typename;

      // Only report as error if we have data but it's clearly not a success or failure
      const isSuccess = typename === 'RedeemUserMagicAuthTokenSuccess' || (response.token && response.item);
      const isFailure = typename === 'RedeemUserMagicAuthTokenFailure' || (response.code && response.message);

      if (!isSuccess && !isFailure) {
        console.warn('Unexpected response structure from magic link mutation:', data);
        reportLoginError('Unexpected Response Structure', `Response: ${JSON.stringify(data)}`);
      }
    }
  }, [data, reportLoginError]);

  React.useEffect(() => {
    if (data?.redeemUserMagicAuthToken) {
      const response = data.redeemUserMagicAuthToken;
      const isSuccess = response.__typename === 'RedeemUserMagicAuthTokenSuccess' ||
        (response.token && response.item); // Handle case where typename is undefined but we have success data

      if (isSuccess) {
        // Store the session token
        const sessionToken = response.token;
        if (sessionToken) {
          localStorage.setItem('token', sessionToken);
        }

        // Refetch queries to update user state
        queryClient.refetchQueries();

        // Redirect to home page after a short delay
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }
    }
  }, [data, router, queryClient]);

  // Report authentication failure
  React.useEffect(() => {
    if (data?.redeemUserMagicAuthToken?.__typename === 'RedeemUserMagicAuthTokenFailure') {
      const failureMessage = data.redeemUserMagicAuthToken.message || 'Magic link authentication failed';
      const failureCode = data.redeemUserMagicAuthToken.code || 'Unknown';
      reportLoginError('Authentication Failure', `Code: ${failureCode}, Message: ${failureMessage}`);
    }
  }, [data, reportLoginError]);

  // If user is already authenticated, redirect to home
  React.useEffect(() => {
    if (user?.email) {
      router.push('/');
    }
  }, [user, router]);

  // Show loading state if we have token/email but no data yet, or if mutation is loading
  if ((token && email && !data && !error && !mutationError && !timeoutReached) || loading) {
    return (
      <div
        className="flex items-center justify-center bg-gradient-to-br from-blue-500 to-red-600"
        style={{ minHeight: 'calc(100vh - 200px)' }}
      >
        <div className="text-center text-white">
          <div className="text-4xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold mb-2">
            Verifying your sign-in link...
          </h1>
          <p className="text-lg opacity-80">
            Please wait while we authenticate you.
          </p>
        </div>
      </div>
    );
  }

  // Show error state for network/GraphQL errors or timeout
  if (error || mutationError || timeoutReached) {
    return (
      <div
        className="flex items-center justify-center bg-gradient-to-br from-blue-500 to-red-600"
        style={{ minHeight: 'calc(100vh - 200px)' }}
      >
        <div className="text-center text-white max-w-md mx-auto p-6">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-2">Connection Error</h1>
          <p className="text-lg mb-4 opacity-80">
            {mutationError || error?.message || 'Unable to verify your sign-in link. Please check your connection and try again.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg font-bold transition-all duration-200"
          >
            Return to Sign In
          </button>
        </div>
      </div>
    );
  }

  // Show error state
  if (
    data?.redeemUserMagicAuthToken?.__typename ===
    'RedeemUserMagicAuthTokenFailure'
  ) {
    return (
      <div
        className="flex items-center justify-center bg-gradient-to-br from-blue-500 to-red-600"
        style={{ minHeight: 'calc(100vh - 200px)' }}
      >
        <div className="text-center text-white max-w-md mx-auto p-6">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-2">Sign-in Failed</h1>
          <p className="text-lg mb-4 opacity-80">
            {data?.redeemUserMagicAuthToken?.message ||
              'The sign-in link is invalid or has expired.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg font-bold transition-all duration-200"
          >
            Return to Sign In
          </button>
        </div>
      </div>
    );
  }

  // Show success state
  if (
    data?.redeemUserMagicAuthToken?.__typename ===
    'RedeemUserMagicAuthTokenSuccess' ||
    (data?.redeemUserMagicAuthToken?.token && data?.redeemUserMagicAuthToken?.item)
  ) {
    return (
      <div
        className="flex items-center justify-center bg-gradient-to-br from-blue-500 to-red-600"
        style={{ minHeight: 'calc(100vh - 200px)' }}
      >
        <div className="text-center text-white">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-2xl font-bold mb-2">Welcome back!</h1>
          <p className="text-lg mb-4 opacity-80">
            Successfully signed in as{' '}
            {data?.redeemUserMagicAuthToken?.item?.name}
          </p>
          <p className="text-sm opacity-60">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // Show default error state only if we don't have token/email and router is ready
  // In test environment, treat as ready if router.isReady is not explicitly false
  const isRouterReady = router.isReady !== false;
  if (isRouterReady && (!token || !email)) {
    return (
      <div
        className="flex items-center justify-center bg-gradient-to-br from-blue-500 to-red-600"
        style={{ minHeight: 'calc(100vh - 200px)' }}
      >
        <div className="text-center text-white max-w-md mx-auto p-6">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">Invalid Sign-in Link</h1>
          <p className="text-lg mb-4 opacity-80">
            The sign-in link you used is invalid or has expired. Please request
            a new sign-in link.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg font-bold transition-all duration-200"
          >
            Return to Sign In
          </button>
        </div>
      </div>
    );
  }

  // Fallback loading state
  return (
    <div
      className="flex items-center justify-center bg-gradient-to-br from-blue-500 to-red-600"
      style={{ minHeight: 'calc(100vh - 200px)' }}
    >
      <div className="text-center text-white">
        <div className="text-4xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold mb-2">Processing...</h1>
        <p className="text-lg opacity-80">
          Please wait while we process your request.
        </p>
      </div>
    </div>
  );
}
