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
  const [signout] = useGqlMutation<SignOutData>(SIGN_OUT_MUTATION);

  return (
    <GradientButton
      type="button"
      onClick={async () => {
        try {
          // Clear the token from localStorage first
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
          }

          // Clear all queries before calling endSession
          queryClient.clear();

          // Call the endSession mutation
          await signout({});

          // Force a page reload to ensure clean state
          window.location.href = '/';
        } catch (error) {
          console.error('Error during sign out:', error);
          // Even if there's an error, clear everything and redirect
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            window.location.href = '/';
          }
        }
      }}
    >
      Sign Out
    </GradientButton>
  );
};

export default SignOut;
