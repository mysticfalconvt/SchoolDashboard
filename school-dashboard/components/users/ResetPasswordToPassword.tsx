import { useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import GradientButton from '../styles/Button';

const RESET_PASSWORD_TO_PASSWORD_MUTATION = gql`
  mutation RESET_PASSWORD_TO_PASSWORD_MUTATION($id: ID!) {
    updateUser(where: { id: $id }, data: { password: "password" }) {
      id
    }
  }
`;

interface ResetPasswordToPasswordProps {
  userID: string;
}

export default function ResetPasswordToPassword({
  userID,
}: ResetPasswordToPasswordProps) {
  const [resetThePassword, { loading, error, data }] = useMutation(
    RESET_PASSWORD_TO_PASSWORD_MUTATION,
    {
      variables: {
        id: userID,
      },
    },
  );

  return (
    <GradientButton
      type="button"
      disabled={loading || data}
      onClick={() => resetThePassword()}
    >
      {!data && !loading && <span>Reset Password to Password</span>}
      {loading && 'Resetting password...'}
      {data && <span>Password Reset!!</span>}
    </GradientButton>
  );
}
