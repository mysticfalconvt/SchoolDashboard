import { useMutation } from '@apollo/client';
// @ts-ignore
import { request } from 'graphql-request';
import gql from 'graphql-tag';
import React from 'react';
import { useQueryClient } from 'react-query';
import { endpoint, prodEndpoint } from '../../config';
import useForm from '../../lib/useForm';
import Error from '../ErrorMessage';
import Form from '../styles/Form';

interface FormInputs {
  email: string;
  password: string;
}

interface SignInData {
  authenticateUserWithPassword: {
    __typename: string;
    item?: {
      name: string;
      email: string;
      id: string;
    };
    sessionToken?: string;
    message?: string;
  };
}

interface SignInVariables {
  email: string;
  password: string;
}

const SIGNIN_MUTATION = gql`
  mutation SIGNIN_MUTATION($email: String!, $password: String!) {
    authenticateUserWithPassword(email: $email, password: $password) {
      __typename
      ... on UserAuthenticationWithPasswordSuccess {
        item {
          name
          email
          id
        }
        sessionToken
      }
      ... on UserAuthenticationWithPasswordFailure {
        message
      }
    }
  }
`;

const SignIn: React.FC = () => {
  const { inputs, handleChange, resetForm } = useForm({
    email: '',
    password: '',
  });
  const queryClient = useQueryClient();
  const [signin, { data, loading }] = useMutation<SignInData, SignInVariables>(
    SIGNIN_MUTATION,
    {
      variables: {
        email: inputs?.email?.toLowerCase() || '',
        password: inputs?.password || '',
      },
      // refetch the currently logged in user
      // refetchQueries: [{ query: CURRENT_USER_QUERY }],
    },
  );
  // console.log(lowercaseEmail);
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); // stop the form from submitting
    // console.log(inputs);
    const newRes = await signinNew({
      email: inputs.email,
      password: inputs.password,
    });
    const res = await signin();
    queryClient.refetchQueries();
    // refetch();
    resetForm();
    // Send the email and password to the graphqlAPI
  }
  // console.log(data)
  const error =
    data?.authenticateUserWithPassword.__typename ===
    'UserAuthenticationWithPasswordFailure'
      ? data?.authenticateUserWithPassword
      : undefined;

  return (
    <Form method="POST" onSubmit={handleSubmit}>
      <h2>Sign Into Your Account</h2>
      <Error error={error as any} />
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
};

// const endpoint = "http://localhost:3000/api/graphql";

async function signinNew({ email, password }: FormInputs) {
  const endppointToUse =
    process.env.NODE_ENV === 'development' ? endpoint : prodEndpoint;

  const res = await request(
    endppointToUse,
    SIGNIN_MUTATION,
    {
      email: email.toLowerCase(),
      password,
    },
    Headers,
  );
  // console.log("signin",res);
  const token = res.authenticateUserWithPassword.sessionToken;
  // console.log("token",token);
  localStorage.setItem('token', token);
  return res.data;
}

export default SignIn;
