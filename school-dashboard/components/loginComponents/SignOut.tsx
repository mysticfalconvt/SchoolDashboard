import { useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import React from 'react';
import { useQueryClient } from 'react-query';
import GradientButton from '../styles/Button';

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
  const [signout] = useMutation<SignOutData>(SIGN_OUT_MUTATION, {
    // refetchQueries: [{ query: CURRENT_USER_QUERY }],
  });

  return (
    <GradientButton
      type="button"
      onClick={async () => {
        const res = await signout();
        queryClient.refetchQueries();
        queryClient.removeQueries();
        queryClient.clear();
      }}
    >
      Sign Out
    </GradientButton>
  );
};

export default SignOut;
