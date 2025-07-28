import type { DocumentNode } from 'graphql';
import { useQuery, UseQueryOptions } from 'react-query';
import { endpoint, prodEndpoint } from '../config';
import { GraphQLClient } from './graphqlClient';

export const useGQLQuery = <TData = any>(
  key: string,
  query: DocumentNode,
  variables?: Record<string, any>,
  config: Partial<UseQueryOptions<TData, Error, TData>> = {},
) => {
  const headers = {
    credentials: 'include' as const,
    mode: 'cors' as const,
    // headers: {
    //   authorization: `Bearer token goes here`,
    // },
  };

  const graphQLClient = new GraphQLClient(
    process.env.NODE_ENV === 'development' ? endpoint : prodEndpoint,
    headers,
  );
  // console.log(GraphQLClient);
  const fetchData = async (): Promise<TData> =>
    await graphQLClient.request(query, variables);
  // console.log(document)
  // const fetchData = async () => await request(endpoint, query, variables);

  return useQuery<TData, Error, TData>(key, fetchData, config);
};

export const useAsyncGQLQuery = <TData = any>(query: DocumentNode) => {
  const headers = {
    credentials: 'include' as const,
    mode: 'cors' as const,
    // headers: {
    //   authorization: `Bearer token goes here`,
    // },
  };

  const graphQLClient = new GraphQLClient(
    process.env.NODE_ENV === 'development' ? endpoint : prodEndpoint,
    headers,
  );
  // console.log(GraphQLClient);
  const fetchData = async (variables?: Record<string, any>): Promise<TData> =>
    await graphQLClient.request(query, variables);

  return fetchData;
};
