import type { NextApiRequest, NextApiResponse } from 'next';

interface Model {
  id: string;
  name: string;
  available: boolean;
}

interface ModelsResponse {
  models: Model[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ModelsResponse | { error: string }>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const COMMUNICATOR_ENDPOINT = process.env.COMMUNICATOR_ENDPOINT;
  const COMMUNICATOR_API_KEY = process.env.COMMUNICATOR_API_KEY;

  if (!COMMUNICATOR_ENDPOINT || !COMMUNICATOR_API_KEY) {
    return res.status(500).json({
      error: 'Communicator service configuration is missing',
    });
  }

  try {
    const response = await fetch(`${COMMUNICATOR_ENDPOINT}/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': COMMUNICATOR_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data: ModelsResponse = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Models API Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch models',
    });
  }
}
