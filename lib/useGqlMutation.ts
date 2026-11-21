import type { DocumentNode } from 'graphql';
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import { endpoint } from '../config';
import { GraphQLClient } from './graphqlClient';

export const useGqlMutation = <TData = any, TVariables = any>(
  mutation: DocumentNode,
  options: Partial<UseMutationOptions<TData, Error, TVariables>> = {},
) => {
  const queryClient = useQueryClient();

  const mutateFn = async (variables?: TVariables): Promise<TData> => {
    // Create a new client instance for each request to ensure fresh token
    const graphQLClient = new GraphQLClient(
      endpoint,
      {
        headers: {
          credentials: 'include',
          mode: 'cors',
        },
      },
    );
    return await graphQLClient.request(mutation, variables as object);
  };

  const mutationResult = useMutation<TData, Error, TVariables>({
    mutationFn: mutateFn,
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
      loading: mutationResult.isPending,
      error: mutationResult.error,
      mutateAsync: mutationResult.mutateAsync,
    },
  ] as const;
};
