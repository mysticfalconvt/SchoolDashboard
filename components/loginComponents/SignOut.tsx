import GradientButton from '@/components/styles/Button';
import { useGqlMutation } from '@/lib/useGqlMutation';
import gql from 'graphql-tag';
import React from 'react';
import { useQueryClient } from 'react-query';

interface SignOutData {
  endSession: boolean;
}

const SIGN_OUT_MUTATION = gql`
  mutation {
    endSession
  }
`;

const SignOut: React.FC = () => {
  const queryClient = useQueryClient();
  const [
    ,
    { mutateAsync: endSession },
  ] = useGqlMutation<SignOutData>(SIGN_OUT_MUTATION, {
    // The default onSuccess invalidates every query. That refetches `me` while
    // we are still on the page and repaints the signed-in UI. We are leaving
    // for a fresh page load anyway, so there is nothing worth refetching.
    onSuccess: () => {},
  });
  const [signingOut, setSigningOut] = React.useState(false);

  return (
    <GradientButton
      type="button"
      disabled={signingOut}
      onClick={async () => {
        setSigningOut(true);
        try {
          // End the session on the server FIRST -- while the request still
          // carries the token/cookie that identifies the session -- and wait
          // for it to finish. `mutate` is fire-and-forget in react-query v3, so
          // the previous `await signout({})` resolved immediately: the token
          // was already gone (making endSession anonymous) and the navigation
          // below tore the request down before it landed. The session survived
          // and the very next `me` query signed us back in.
          await endSession({});
        } catch (error) {
          console.error('Error during sign out:', error);
        } finally {
          // Only now drop the local credentials and cache.
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('impersonatorToken');
          }
          queryClient.clear();
          // Full navigation so nothing in memory survives, and `replace` so the
          // signed-in page is not sitting one Back press away.
          window.location.replace('/');
        }
      }}
    >
      {signingOut ? 'Signing Out...' : 'Sign Out'}
    </GradientButton>
  );
};

export default SignOut;
