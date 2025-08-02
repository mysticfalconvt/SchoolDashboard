import { NextApiRequest, NextApiResponse } from 'next';
import { GraphQLClient } from '../../lib/graphqlClient';

// This is a proxy to your actual GraphQL server
// You'll need to update this URL to point to your actual GraphQL server
const GRAPHQL_SERVER_URL =
  process.env.GRAPHQL_SERVER_URL || 'http://localhost:3000/api/graphql';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { query, variables } = req.body;

    if (!query) {
      return res.status(400).json({ message: 'Query is required' });
    }

    const client = new GraphQLClient(GRAPHQL_SERVER_URL, {
      headers: {
        authorization: req.headers.authorization || '',
      },
    });

    const data = await client.request(query, variables);
    res.status(200).json(data);
  } catch (error) {
    console.error('GraphQL API Error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
