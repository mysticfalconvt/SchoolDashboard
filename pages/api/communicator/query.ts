import type { NextApiRequest, NextApiResponse } from 'next';
import { isValidCommunicatorKey } from '../../../lib/communicator/auth';
import { queryGenerator } from '../../../lib/communicator/queryGenerator';
import type { QueryRequest, QueryResponse } from '../../../lib/communicator/types';

// The pipeline makes several LLM calls and can return large raw GraphQL data,
// so allow long-running responses without the default 4MB size warning.
export const config = {
  api: {
    responseLimit: false,
  },
};

// Ported from the standalone communicator service (src/routes/query.ts).
// Runs the natural-language -> GraphQL -> explanation pipeline. Called
// service-to-service by the Keystone backend's queryCommunicator mutation, so it
// is gated by the communicator API key.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<QueryResponse | { error: string; message: string }>,
) {
  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({ error: 'Method not allowed', message: 'Use POST' });
  }

  if (!isValidCommunicatorKey(req.headers['x-api-key'] as string | undefined)) {
    return res
      .status(401)
      .json({ error: 'Unauthorized', message: 'Invalid or missing API key' });
  }

  try {
    const body: QueryRequest = req.body;

    // Validate required fields
    if (!body.question || typeof body.question !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Request must include a "question" string',
      });
    }

    if (!body.model || typeof body.model !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Request must include a "model" string',
      });
    }

    // Process the query
    const result = await queryGenerator.processQuery(
      body.question,
      body.model,
      body.userId,
      body.userName,
    );

    // Build response
    const response: QueryResponse = {
      question: body.question,
      explanation: result.explanation,
      graphqlQuery: result.query,
      timestamp: new Date().toISOString(),
      iterations: result.iterations,
      evaluationScore: result.evaluationScore,
    };

    // Include raw data if requested (default: true)
    if (body.includeRawData !== false) {
      response.rawData = result.data;
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Query endpoint error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message:
        error instanceof Error ? error.message : 'Failed to process query',
    });
  }
}
