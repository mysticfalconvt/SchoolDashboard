import type { DocumentNode } from 'graphql';
import { useQuery, UseQueryOptions } from 'react-query';
import { endpoint, prodEndpoint } from '../config';
import { GraphQLClient } from './graphqlClient';

// Create a singleton GraphQL client to prevent recreating it on every hook call
const graphQLClient = new GraphQLClient(
  process.env.NODE_ENV === 'development' ? endpoint : prodEndpoint,
  {
    headers: {
      credentials: 'include',
      mode: 'cors',
      // authorization: `Bearer token goes here`,
    },
  },
);

export const useGQLQuery = <TData = any>(
  key: string,
  query: DocumentNode,
  variables?: Record<string, any>,
  config: Partial<UseQueryOptions<TData, Error, TData>> = {},
) => {
  // console.log(GraphQLClient);
  const fetchData = async (): Promise<TData> =>
    await graphQLClient.request(query, variables);
  // console.log(document)
  // const fetchData = async () => await request(endpoint, query, variables);

  // Include variables in the query key so React Query knows when to refetch
  const queryKey = variables ? [key, variables] : [key];

  return useQuery<TData, Error, TData>(queryKey, fetchData, config);
};

export const useAsyncGQLQuery = <TData = any>(query: DocumentNode) => {
  // console.log(GraphQLClient);
  const fetchData = async (variables?: Record<string, any>): Promise<TData> =>
    await graphQLClient.request(query, variables);

  return fetchData;
};
