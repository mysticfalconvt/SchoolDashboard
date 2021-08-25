import gql from 'graphql-tag';
import { useMutation } from '@apollo/client';
import { useQueryClient } from 'react-query';
import Form from '../styles/Form';
import useForm from '../../lib/useForm';
import { CURRENT_USER_QUERY, useUser } from '../User';
import Error from '../ErrorMessage';
import { useGQLQuery } from '../../lib/useGqlQuery';

const SIGNIN_MUTATION = gql`
  mutation SIGNIN_MUTATION($email: String!, $password: String!) {
    authenticateUserWithPassword(email: $email, password: $password) {
      ... on UserAuthenticationWithPasswordSuccess {
        item {
          id
          email
          name
        }
      }
      ... on UserAuthenticationWithPasswordFailure {
        code
        message
      }
    }
  }
`;

export default function SignIn() {
  const { inputs, handleChange, resetForm } = useForm({
    email: '',
    password: '',
  });
  const queryClient = useQueryClient();
  const [signin, { data, loading }] = useMutation(SIGNIN_MUTATION, {
    variables: {
      email: inputs.email.toLowerCase(),
      password: inputs.password,
    },
    // refetch the currently logged in user
    refetchQueries: [{ query: CURRENT_USER_QUERY }],
  });
  // console.log(lowercaseEmail);
  async function handleSubmit(e) {
    e.preventDefault(); // stop the form from submitting
    console.log(inputs);
    const lowercaseEmail = inputs.email.toLowerCase();
    const { password } = inputs;
    const res = await signin();
    // console.log(res);
    queryClient.refetchQueries();
    // refetch();
    resetForm();
    // Send the email and password to the graphqlAPI
  }

  const error =
    data?.authenticateUserWithPassword.__typename ===
    'UserAuthenticationWithPasswordFailure'
      ? data?.authenticateUserWithPassword
      : undefined;
  return (
    <Form method="POST" onSubmit={handleSubmit}>
      <h2>Sign Into Your Account</h2>
      <Error error={error} />
      <fieldset>
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
        <button type="submit">Sign In!</button>
      </fieldset>
    </Form>
  );
}
