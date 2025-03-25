import { useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import { useRouter } from 'next/router';
import * as React from 'react';
import { useQueryClient } from 'react-query';
import { useUser } from '../components/User';

const LOGIN_LINK_MUTATION = gql`
  mutation LOGIN_LINK_MUTATION($token: String!, $email: String!) {
    redeemUserMagicAuthToken(email: $email, token: $token) {
      ... on RedeemUserMagicAuthTokenSuccess {
        token
        item {
          name
          email
          id
        }
      }
      ... on RedeemUserMagicAuthTokenFailure {
        code
        message
      }
    }
  }
`;
export default function LoginLink() {
  const router = useRouter();
  const token = router.query.token;
  const email = router.query.email;
  const user = useUser();
  const [mutation, { data, loading, error }] = useMutation(
    LOGIN_LINK_MUTATION,
    {
      variables: { token, email },
    },
  );
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (token && email && !data) {
      mutation();
    }
  }, [token, email, data, mutation]);

  React.useEffect(() => {
    if (
      //   data?.redeemUserMagicAuthToken?.__typename ===
      //     "RedeemUserMagicAuthTokenSuccess" &&
      user?.email
    ) {
      router.push('/');
    }
  }, [data, router, user]);

  if (
    data?.redeemUserMagicAuthToken?.__typename ===
    'RedeemUserMagicAuthTokenFailure'
  ) {
    return <p>{data?.redeemUserMagicAuthToken?.message}</p>;
  }
  if (
    data?.redeemUserMagicAuthToken?.__typename ===
    'RedeemUserMagicAuthTokenSuccess'
  ) {
    queryClient.refetchQueries();

    return (
      <div>
        Token Redeemed - Logging in user{' '}
        {data?.redeemUserMagicAuthToken?.item?.name}
      </div>
    );
  }
  return (
    <div>
      Did you redeem a magic auth email link? Something went wrong, please try
      again
    </div>
  );
}
