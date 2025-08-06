import type { DocumentNode } from 'graphql';
import { useMutation, UseMutationOptions, useQueryClient } from 'react-query';
import { endpoint, prodEndpoint } from '../config';
import { GraphQLClient } from './graphqlClient';

export const useGqlMutation = <TData = any, TVariables = any>(
  mutation: DocumentNode,
  options: Partial<UseMutationOptions<TData, Error, TVariables>> = {},
) => {
  const queryClient = useQueryClient();

  const graphQLClient = new GraphQLClient(
    process.env.NODE_ENV === 'development' ? endpoint : prodEndpoint,
    {
      headers: {
        credentials: 'include',
        mode: 'cors',
      },
    },
  );

  const mutateFn = async (variables?: TVariables): Promise<TData> =>
    await graphQLClient.request(mutation, variables as object);

  const mutationResult = useMutation<TData, Error, TVariables>(mutateFn, {
    onSuccess: () => {
      // Invalidate and refetch all queries
      queryClient.invalidateQueries();
    },
    ...options,
  });

  // Return in Apollo-style format for backward compatibility
  return [
    mutationResult.mutate,
    {
      data: mutationResult.data,
      loading: mutationResult.isLoading,
      error: mutationResult.error,
    },
  ] as const;
};
