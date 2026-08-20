import { endpoint, GoogleClientId } from '@/config';
import { GraphQLClient } from '@/lib/graphqlClient';
import gql from 'graphql-tag';
import Script from 'next/script';
import React from 'react';

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
        // credentials: 'include' to match every other call in the app
        // (useGqlQuery/useGqlMutation set it). Without it the browser drops any
        // session cookie the backend sets here, so a Google session lived only
        // in localStorage and behaved differently from the other sign-in paths.
        const client = new GraphQLClient(endpoint, {
          headers: { credentials: 'include', mode: 'cors' },
        });
        const res = await client.request<{
          authenticateUserWithGoogle: GoogleAuthResult;
        }>(GOOGLE_SIGNIN_MUTATION, { idToken });
        const result = res.authenticateUserWithGoogle;
        if (result?.success && result.sessionToken) {
          localStorage.setItem('token', result.sessionToken);
          // Reload rather than refetchQueries(): the `me` query is usually
          // already in flight (unauthenticated) when the credential comes back,
          // and react-query dedupes the refetch onto that request -- caching
          // "signed out" for the next five minutes. A full load starts from the
          // token we just stored. Same URL, so the user keeps their place.
          window.location.reload();
        } else {
          setError(result?.message || 'Unable to sign in with Google');
        }
      } catch (err: any) {
        setError(err?.message || 'Unable to sign in with Google');
      }
    },
    [],
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
