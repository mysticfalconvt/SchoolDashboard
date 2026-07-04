import { allowImpersonation, endpoint } from '@/config';
import { GraphQLClient } from '@/lib/graphqlClient';
import gql from 'graphql-tag';
import React from 'react';
import toast from 'react-hot-toast';
import isAllowed from '../../lib/isAllowed';
import { SmallGradientButton } from '../styles/Button';
import { useUser } from '../User';

const IMPERSONATE_MUTATION = gql`
  mutation IMPERSONATE_USER($userId: String!) {
    impersonateUser(userId: $userId)
  }
`;

interface ImpersonateResult {
  success: boolean;
  sessionToken?: string;
  item?: { id: string; name: string; email: string };
  message?: string;
}

interface ImpersonateButtonProps {
  userId: string;
  userName?: string;
}

// Dev tool: sign in as another user. Self-gates on the env flag + superadmin,
// so it is safe to render unconditionally on a user's page.
export default function ImpersonateButton({
  userId,
  userName,
}: ImpersonateButtonProps) {
  const me = useUser();

  if (!allowImpersonation) return null;
  if (!isAllowed(me, 'isSuperAdmin')) return null;
  if (!userId || me?.id === userId) return null;

  const impersonate = async () => {
    try {
      const client = new GraphQLClient(endpoint);
      const res = await client.request<{
        impersonateUser: ImpersonateResult;
      }>(IMPERSONATE_MUTATION, { userId });
      const result = res.impersonateUser;

      if (result?.success && result.sessionToken) {
        // Preserve the impersonator's own token so we can return to it later.
        const currentToken = localStorage.getItem('token');
        if (currentToken && !localStorage.getItem('impersonatorToken')) {
          localStorage.setItem('impersonatorToken', currentToken);
        }
        localStorage.setItem('token', result.sessionToken);
        toast.success(
          `Now impersonating ${result.item?.name || userName || 'user'}`,
        );
        // Full reload so the new session is picked up everywhere.
        window.location.href = '/';
      } else {
        toast.error(result?.message || 'Could not impersonate user');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Could not impersonate user');
    }
  };

  return (
    <SmallGradientButton type="button" onClick={impersonate}>
      Impersonate {userName || 'user'}
    </SmallGradientButton>
  );
}
