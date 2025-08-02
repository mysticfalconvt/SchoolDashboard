import GradientButton from '@/components/styles/Button';
import { useGqlMutation } from '@/lib/useGqlMutation';
import gql from 'graphql-tag';

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
  const [resetThePassword, { loading, error, data }] = useGqlMutation(
    RESET_PASSWORD_TO_PASSWORD_MUTATION,
  );

  return (
    <GradientButton
      type="button"
      disabled={loading || data}
      onClick={() =>
        resetThePassword({
          id: userID,
        })
      }
    >
      {!data && !loading && <span>Reset Password to Password</span>}
      {loading && 'Resetting password...'}
      {data && <span>Password Reset!!</span>}
    </GradientButton>
  );
}
