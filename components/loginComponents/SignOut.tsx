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
        await signout({});
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
