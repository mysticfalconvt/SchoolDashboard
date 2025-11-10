import type { NextApiRequest, NextApiResponse } from 'next';

interface QueryRequest {
  question: string;
  model: string;
  includeRawData?: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>,
) {
  if (req.method !== 'POST') {
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
    const { question, model, includeRawData }: QueryRequest = req.body;

    if (!question || !model) {
      return res.status(400).json({
        error: 'Question and model are required',
      });
    }

    const response = await fetch(`${COMMUNICATOR_ENDPOINT}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/javascript',
        'x-api-key': COMMUNICATOR_API_KEY,
      },
      body: JSON.stringify({
        question,
        model,
        includeRawData: includeRawData ?? true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Query API error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Query API Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Query request failed',
    });
  }
}
