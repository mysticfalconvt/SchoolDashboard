import type { DocumentNode } from 'graphql';
import { useMutation, UseMutationOptions } from 'react-query';
import { endpoint } from '../config';
import { GraphQLClient } from './graphqlClient';

export const useGQLMutation = <
  TData = any,
  TError = Error,
  TVariables = Record<string, any>,
>(
  key: string,
  query: DocumentNode,
  variables?: TVariables,
  config: Partial<UseMutationOptions<TData, TError, TVariables>> = {},
) => {
  const headers = {
    headers: {
      authorization: `Bearer token goes here`,
    },
  };

  const graphQLClient = new GraphQLClient(endpoint, headers);
  const fetchData = async (vars?: TVariables): Promise<TData> =>
    await graphQLClient.request(query, (vars || variables) as object);

  // const fetchData = async () => await request(endpoint, query, variables);

  return useMutation<TData, TError, TVariables>(key, fetchData, config);
};
