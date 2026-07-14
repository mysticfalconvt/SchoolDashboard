import type { NextApiRequest, NextApiResponse } from 'next';
import { lmStudio } from '../../../lib/communicator/lmStudio';

interface Model {
  id: string;
  name: string;
  available: boolean;
  maxContextLength?: number;
}

interface ModelsResponse {
  models: Model[];
}

// Ported from the standalone communicator service (src/routes/models.ts).
// Lists the LLM models available from LM Studio. Called directly by the browser
// (no API key), so it is intentionally unauthenticated.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ModelsResponse | { error: string }>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const lmModels = await lmStudio.getModelsWithLimits();

    const response: ModelsResponse = {
      models: lmModels.map((model) => ({
        id: model.id,
        name: model.id, // LM Studio doesn't provide a separate display name
        available: true,
        maxContextLength:
          model.max_context_length > 0 ? model.max_context_length : undefined,
      })),
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Models API Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch models',
    });
  }
}
