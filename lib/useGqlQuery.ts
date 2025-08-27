import type { DocumentNode } from 'graphql';
import { useQuery, UseQueryOptions } from 'react-query';
import { endpoint } from '../config';
import { GraphQLClient } from './graphqlClient';

// Create a singleton GraphQL client to prevent recreating it on every hook call
const graphQLClient = new GraphQLClient(
  endpoint,
  {
    headers: {
      credentials: 'include',
      mode: 'cors',
    },
  },
);

export const useGQLQuery = <TData = any>(
  key: string,
  query: DocumentNode,
  variables?: Record<string, any>,
  config: Partial<UseQueryOptions<TData, Error, TData>> = {},
) => {
  const fetchData = async (): Promise<TData> => {
    // Create a new client instance for each request to ensure fresh token
    const client = new GraphQLClient(
      endpoint,
      {
        headers: {
          credentials: 'include',
          mode: 'cors',
        },
      },
    );
    return await client.request(query, variables);
  };

  // Include variables in the query key so React Query knows when to refetch
  const queryKey = variables ? [key, variables] : [key];

  return useQuery<TData, Error, TData>(queryKey, fetchData, config);
};

export const useAsyncGQLQuery = <TData = any>(query: DocumentNode) => {
  const fetchData = async (variables?: Record<string, any>): Promise<TData> => {
    const client = new GraphQLClient(
      endpoint,
      {
        headers: {
          credentials: 'include',
          mode: 'cors',
        },
      },
    );
    return await client.request(query, variables);
  };

  return fetchData;
};
