// Ported from the standalone communicator service (src/services/graphql.ts).
// Changes vs. the original:
//  - Endpoint + auth come from this app's existing config.ts (backendEndpoint /
//    GRAPHQL_AUTHORIZATION) instead of dedicated env vars.
//  - The schema file lives at lib/communicator/schema.graphql.
// The { data, errors } return shape is preserved because the query-generation
// pipeline inspects result.errors to auto-repair invalid queries.
import { readFileSync } from 'fs';
import { join } from 'path';
import { backendEndpoint, GRAPHQL_AUTHORIZATION } from '../../config';
import type { GraphQLRequest, GraphQLResponse } from './types';

export class GraphQLClient {
  private endpoint: string;
  private schema: string | null = null;
  private lastSchemaFetch: number = 0;
  private readonly SCHEMA_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.endpoint = backendEndpoint;
  }

  /**
   * Execute a GraphQL query
   */
  async query<T = any>(request: GraphQLRequest): Promise<GraphQLResponse<T>> {
    try {
      console.log('Sending GraphQL query:', request.query.substring(0, 200));
      if (request.variables) {
        console.log('Variables:', JSON.stringify(request.variables));
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add API key if configured (sent raw, no "Bearer " prefix — Keystone
      // expects the key verbatim, matching the original communicator behavior).
      if (GRAPHQL_AUTHORIZATION) {
        headers['Authorization'] = `${GRAPHQL_AUTHORIZATION}`;
      }

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('GraphQL error response:', errorText);
        throw new Error(
          `GraphQL request failed: ${response.statusText}. ${errorText}`,
        );
      }

      const result = (await response.json()) as GraphQLResponse<T>;

      // Log GraphQL errors even if HTTP status is 200
      if (result.errors) {
        console.error(
          'GraphQL errors:',
          JSON.stringify(result.errors, null, 2),
        );
      }

      return result;
    } catch (error) {
      console.error('GraphQL query error:', error);
      throw error;
    }
  }

  /**
   * Get the GraphQL schema from the schema.graphql file (with caching)
   */
  async getSchema(forceRefresh: boolean = false): Promise<string> {
    const now = Date.now();

    // Return cached schema if still valid
    if (
      !forceRefresh &&
      this.schema &&
      now - this.lastSchemaFetch < this.SCHEMA_CACHE_TTL
    ) {
      return this.schema;
    }

    // Load schema from file
    try {
      const schemaPath = join(
        process.cwd(),
        'lib',
        'communicator',
        'schema.graphql',
      );
      this.schema = readFileSync(schemaPath, 'utf-8');
      this.lastSchemaFetch = now;
      console.log('Loaded schema from file');
      return this.schema;
    } catch (error) {
      console.error('Failed to load schema from file:', error);
      throw new Error(
        'Could not load GraphQL schema from lib/communicator/schema.graphql file.',
      );
    }
  }

  /**
   * Clear the schema cache
   */
  clearCache(): void {
    this.schema = null;
    this.lastSchemaFetch = 0;
  }
}

// Export singleton instance
export const graphql = new GraphQLClient();
