import useForm from '@/lib/useForm';
import { useGqlMutation } from '@/lib/useGqlMutation';
import gql from 'graphql-tag';
import { useRouter } from 'next/router';
import React from 'react';
import Error from './ErrorMessage';
import Form from './styles/Form';

const RESET_MUTATION = gql`
  mutation RESET_MUTATION(
    $email: String!
    $password: String!
    $token: String!
  ) {
    redeemUserPasswordResetToken(
      email: $email
      token: $token
      password: $password
    ) {
      code
      message
    }
  }
`;

interface ResetInputs {
  email: string;
  password: string;
  token: string;
}

interface ResetProps {
  token: string;
}

interface ResetMutationData {
  redeemUserPasswordResetToken?: {
    code?: string;
    message?: string;
  } | null;
}

interface ResetMutationVariables {
  email: string;
  password: string;
  token: string;
}

const Reset: React.FC<ResetProps> = ({ token }) => {
  const router = useRouter();
  const { inputs, handleChange, resetForm } = useForm({
    email: '',
    password: '',
    token,
  });
  const [reset, { data, loading, error }] = useGqlMutation<
    ResetMutationData,
    ResetMutationVariables
  >(RESET_MUTATION);
  const successfulError = data?.redeemUserPasswordResetToken?.code
    ? data?.redeemUserPasswordResetToken
    : undefined;
  console.log(error);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); // stop the form from submitting
    await reset({
      email: inputs.email,
      password: inputs.password,
      token: inputs.token,
    });
    resetForm();
    router.push('/');

    // Send the email and password to the graphqlAPI
  }

  return (
    <Form method="POST" onSubmit={handleSubmit}>
      <h2>Reset Your Password</h2>
      <Error error={error || (successfulError as any)} />
      <fieldset>
        {data?.redeemUserPasswordResetToken === null && (
          <p>Success! You can Now sign in</p>
        )}

        <label htmlFor="email">
          Email
          <input
            type="email"
            name="email"
            placeholder="Your Email Address"
            autoComplete="email"
            value={inputs.email}
            onChange={handleChange}
          />
        </label>
        <label htmlFor="password">
          Password
          <input
            type="password"
            name="password"
            placeholder="Password"
            autoComplete="password"
            value={inputs.password}
            onChange={handleChange}
          />
        </label>
        <button type="submit">Request Reset!</button>
      </fieldset>
    </Form>
  );
};

export default Reset;
