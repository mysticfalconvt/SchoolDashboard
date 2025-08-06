import { useGqlMutation } from '@/lib/useGqlMutation';
import gql from 'graphql-tag';
import React from 'react';
import useForm from '../../lib/useForm';
import Error from '../ErrorMessage';
import Form from '../styles/Form';

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

const SEND_MAGIC_LINK_MUTATION = gql`
  mutation SEND_MAGIC_LINK_MUTATION($email: String!) {
    sendUserMagicAuthLink(email: $email)
  }
`;

const REDEEM_MAGIC_LINK_MUTATION = gql`
  mutation REDEEM_MAGIC_LINK_MUTATION($email: String!, $token: String!) {
    redeemUserMagicAuthToken(email: $email, token: $token) {
      code
      user {
        name
        email
        id
      }
    }
  }
`;

interface SignInInputs {
  email: string;
  password: string;
}

const MagicLinkSignIn: React.FC = () => {
  const { inputs, handleChange, resetForm } = useForm({
    email: '',
    password: '',
  });
  const [magicLinkSent, setMagicLinkSent] = React.useState(false);
  const [
    sendMagicLink,
    { data: sendData, loading: sendMagicLinkLoading, error: sendError },
  ] = useGqlMutation(SEND_MAGIC_LINK_MUTATION);

  const [
    signin,
    { data: signinData, loading: signinLoading, error: signinError },
  ] = useGqlMutation(SIGNIN_MUTATION);
  // console.log(lowercaseEmail);

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendMagicLink({
        email: inputs?.email?.toLowerCase(),
      });
      setMagicLinkSent(true);
    } catch (error) {
      console.error('Error sending magic link:', error);
    }
  };

  const error =
    signinData?.authenticateUserWithPassword.__typename ===
    'UserAuthenticationWithPasswordFailure'
      ? signinData?.authenticateUserWithPassword
      : undefined;

  return (
    <Form method="POST" onSubmit={handleSendMagicLink}>
      {!magicLinkSent && <h2>Sign Into Your Account</h2>}
      <Error error={error} />
      {!magicLinkSent && (
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
              disabled={sendMagicLinkLoading || magicLinkSent}
            />
          </label>
          {/* <label htmlFor="password">
          Password
          <input
            type="password"
            name="password"
            placeholder="Password"
            autoComplete="password"
            value={inputs.password}
            onChange={handleChange}
          />
        </label> */}
          <button type="submit">Send a Sign In Link</button>
        </fieldset>
      )}
      {magicLinkSent && (
        <p className="text-4xl">
          Check your email for the sign in link. If no email is received, check
          your email address and spam folder
        </p>
      )}
    </Form>
  );
};

export default MagicLinkSignIn;
