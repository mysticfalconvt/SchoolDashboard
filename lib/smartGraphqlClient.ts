import { GraphQLClient } from './graphqlClient';
import { backendEndpoint, fallbackBackendEndpoint } from '../config';
import { DocumentNode } from 'graphql';

interface SmartGraphqlClientOptions {
  headers?: Record<string, string>;
  timeout?: number;
}

export class SmartGraphqlClient {
  private primaryEndpoint: string;
  private fallbackEndpoint: string;
  private options: SmartGraphqlClientOptions;

  constructor(options: SmartGraphqlClientOptions = {}) {
    this.primaryEndpoint = backendEndpoint;
    this.fallbackEndpoint = fallbackBackendEndpoint;
    this.options = {
      timeout: 5000,
      ...options,
    };
  }

  async request<T = any>(
    query: DocumentNode | string,
    variables?: Record<string, any>
  ): Promise<T> {
    // Try primary endpoint first
    try {
      console.log(`📡 Attempting GraphQL request to primary endpoint: ${this.primaryEndpoint}`);
      
      const startTime = Date.now();
      const primaryClient = new GraphQLClient(this.primaryEndpoint, {
        headers: this.options.headers,
      });
      
      const result = await this.requestWithTimeout<T>(
        primaryClient,
        query,
        variables,
        this.options.timeout!
      );
      
      const duration = Date.now() - startTime;
      console.log(`✅ Primary endpoint succeeded in ${duration}ms`);
      return result;
      
    } catch (primaryError) {
      console.warn(`❌ Primary endpoint failed: ${this.primaryEndpoint}`);
      console.warn(`Error details:`, {
        message: primaryError.message,
        name: primaryError.name,
        // Log response details if available
        response: primaryError.response ? {
          status: primaryError.response.status,
          statusText: primaryError.response.statusText,
          headers: primaryError.response.headers,
          data: typeof primaryError.response.data === 'string' 
            ? primaryError.response.data.substring(0, 200) + '...' 
            : primaryError.response.data
        } : 'No response object',
      });

      // If we have a different fallback endpoint, try it
      if (this.fallbackEndpoint !== this.primaryEndpoint) {
        try {
          console.log(`🔄 Trying fallback endpoint: ${this.fallbackEndpoint}`);
          
          const fallbackStartTime = Date.now();
          const fallbackClient = new GraphQLClient(this.fallbackEndpoint, {
            headers: this.options.headers,
          });
          
          const result = await this.requestWithTimeout<T>(
            fallbackClient,
            query,
            variables,
            this.options.timeout!
          );
          
          const fallbackDuration = Date.now() - fallbackStartTime;
          console.log(`✅ Fallback endpoint succeeded in ${fallbackDuration}ms`);
          return result;
          
        } catch (fallbackError) {
          console.error(`❌ Fallback endpoint also failed: ${this.fallbackEndpoint}`);
          console.error(`Fallback error:`, {
            message: fallbackError.message,
            name: fallbackError.name,
          });
          
          // Throw the original error since both failed
          throw primaryError;
        }
      } else {
        console.error(`💥 No fallback available, primary and fallback endpoints are the same`);
        throw primaryError;
      }
    }
  }

  private async requestWithTimeout<T>(
    client: GraphQLClient,
    query: DocumentNode | string,
    variables?: Record<string, any>,
    timeout: number = 5000
  ): Promise<T> {
    return Promise.race([
      client.request(query, variables),
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Request timeout after ${timeout}ms`)),
          timeout
        )
      ),
    ]);
  }
}

// Export a default instance for convenience
export const smartGraphqlClient = new SmartGraphqlClient({
  headers: {
    authorization: `test auth for keystone`,
  },
});