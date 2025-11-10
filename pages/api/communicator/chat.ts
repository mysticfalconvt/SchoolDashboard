import type { NextApiRequest, NextApiResponse } from 'next';

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
    const { messages, model, ...otherParams } = req.body;

    if (!messages || !model) {
      return res.status(400).json({
        error: 'Messages and model are required',
      });
    }

    const response = await fetch(`${COMMUNICATOR_ENDPOINT}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': COMMUNICATOR_API_KEY,
      },
      body: JSON.stringify({
        messages,
        model,
        ...otherParams,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Chat API error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Chat request failed',
    });
  }
}
