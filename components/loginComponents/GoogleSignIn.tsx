import { endpoint, GoogleClientId } from '@/config';
import { GraphQLClient } from '@/lib/graphqlClient';
import gql from 'graphql-tag';
import Script from 'next/script';
import React from 'react';
import { useQueryClient } from 'react-query';

const GOOGLE_SIGNIN_MUTATION = gql`
  mutation GOOGLE_SIGNIN_MUTATION($idToken: String!) {
    authenticateUserWithGoogle(idToken: $idToken)
  }
`;

interface GoogleAuthResult {
  success: boolean;
  sessionToken?: string;
  item?: { id: string; name: string; email: string };
  message?: string;
}

// Minimal typing for the Google Identity Services global.
declare global {
  interface Window {
    google?: any;
  }
}

const GoogleSignIn: React.FC = () => {
  const queryClient = useQueryClient();
  const buttonRef = React.useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleCredential = React.useCallback(
    async (response: { credential?: string }) => {
      setError(null);
      const idToken = response?.credential;
      if (!idToken) {
        setError('Google sign-in did not return a credential');
        return;
      }
      try {
        const client = new GraphQLClient(endpoint);
        const res = await client.request<{
          authenticateUserWithGoogle: GoogleAuthResult;
        }>(GOOGLE_SIGNIN_MUTATION, { idToken });
        const result = res.authenticateUserWithGoogle;
        if (result?.success && result.sessionToken) {
          localStorage.setItem('token', result.sessionToken);
          await queryClient.refetchQueries();
        } else {
          setError(result?.message || 'Unable to sign in with Google');
        }
      } catch (err: any) {
        setError(err?.message || 'Unable to sign in with Google');
      }
    },
    [queryClient],
  );

  // Initialize Google Identity Services once the script has loaded.
  React.useEffect(() => {
    if (!scriptLoaded || !window.google || !buttonRef.current) return;
    if (!GoogleClientId) {
      setError('Google sign-in is not configured');
      return;
    }
    window.google.accounts.id.initialize({
      client_id: GoogleClientId,
      callback: handleCredential,
    });
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: 'outline',
      size: 'large',
      width: 280,
      text: 'signin_with',
    });
  }, [scriptLoaded, handleCredential]);

  if (!GoogleClientId) return null;

  return (
    <div className="flex flex-col items-center space-y-2">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
      <div ref={buttonRef} />
      {error && <p className="text-red-300 text-sm">{error}</p>}
    </div>
  );
};

export default GoogleSignIn;
