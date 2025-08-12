import { useUser } from '@/components/User';
import { useGqlMutation } from '@/lib/useGqlMutation';
import gql from 'graphql-tag';
import { useRouter } from 'next/router';
import * as React from 'react';
import { useQueryClient } from 'react-query';

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
  const token = router.query.token;
  const email = router.query.email;
  const user = useUser();
  const [mutation, { data, loading, error }] =
    useGqlMutation(LOGIN_LINK_MUTATION);
  const queryClient = useQueryClient();
  const [hasAttemptedMutation, setHasAttemptedMutation] = React.useState(false);

  React.useEffect(() => {
    if (token && email && !data && !loading && !hasAttemptedMutation) {
      setHasAttemptedMutation(true);
      mutation({
        token,
        email,
      });
    }
  }, [token, email, data, mutation, loading, hasAttemptedMutation]);

  React.useEffect(() => {
    if (
      data?.redeemUserMagicAuthToken?.__typename ===
      'RedeemUserMagicAuthTokenSuccess'
    ) {
      // Store the session token
      const sessionToken = data.redeemUserMagicAuthToken.token;
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
  }, [data, router, queryClient]);

  // If user is already authenticated, redirect to home
  React.useEffect(() => {
    if (user?.email) {
      router.push('/');
    }
  }, [user, router]);

  // Show loading state if we have token/email but no data yet, or if mutation is loading
  if ((token && email && !data) || loading) {
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
    'RedeemUserMagicAuthTokenSuccess'
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

  // Show default error state only if we don't have token/email
  if (!token || !email) {
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
