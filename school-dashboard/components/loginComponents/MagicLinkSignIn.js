import gql from "graphql-tag";
import { useMutation } from "@apollo/client";
import { useQueryClient } from "react-query";
import Form from "../styles/Form";
import useForm from "../../lib/useForm";
import { CURRENT_USER_QUERY, useUser } from "../User";
import Error from "../ErrorMessage";
import { useGQLQuery } from "../../lib/useGqlQuery";
import { GraphQLClient, request } from "graphql-request";
import { endpoint, prodEndpoint } from "../../config";
import * as React from "react";

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

export default function MagicLinkSignIn() {
  const { inputs, handleChange, resetForm } = useForm({
    email: "",
    password: "",
  });
  const [magicLinkSent, setMagicLinkSent] = React.useState(false);
  const [
    sendMagicLink,
    { data: sendMagicLinkData, loading: sendMagicLinkLoading },
  ] = useMutation(SEND_MAGIC_LINK_MUTATION);

  const [signin, { data, loading }] = useMutation(SIGNIN_MUTATION, {
    variables: {
      email: inputs?.email?.toLowerCase(),
      password: inputs?.password,
    },
    // refetch the currently logged in user
    // refetchQueries: [{ query: CURRENT_USER_QUERY }],
  });
  // console.log(lowercaseEmail);

  const handleSendMagicLink = async (e) => {
    e.preventDefault();
    const newRes = await sendMagicLink({
      variables: { email: inputs?.email?.toLowerCase() },
    });
    if (newRes?.data?.sendUserMagicAuthLink) {
      setMagicLinkSent(true);
    }
    console.log(newRes);
  };

  const error =
    data?.authenticateUserWithPassword.__typename ===
    "UserAuthenticationWithPasswordFailure"
      ? data?.authenticateUserWithPassword
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
}

// const endpoint = "http://localhost:3000/api/graphql";

async function signinNew({ email, password }) {
  const endppointToUse =
    process.env.NODE_ENV === "development" ? endpoint : prodEndpoint;

  const res = await request(
    endppointToUse,
    SIGNIN_MUTATION,
    {
      email: email.toLowerCase(),
      password,
    },
    Headers
  );
  // console.log("signin",res);
  const token = res.authenticateUserWithPassword.sessionToken;
  // console.log("token",token);
  localStorage.setItem("token", token);
  return res.data;
}
