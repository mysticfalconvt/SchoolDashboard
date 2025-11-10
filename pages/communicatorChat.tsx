import type { NextPage } from 'next';
import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import Loading from '../components/Loading';
import GradientButton from '../components/styles/Button';
import { useUser } from '../components/User';
import isAllowed from '../lib/isAllowed';

interface Model {
  id: string;
  name: string;
  available: boolean;
}

interface ModelsResponse {
  models: Model[];
}

interface QueryResponse {
  question: string;
  explanation: string;
  graphqlQuery?: string;
  timestamp?: string;
  iterations?: number;
  evaluationScore?: number;
  rawData?: any;
}

const fetchModels = async (): Promise<ModelsResponse> => {
  const response = await fetch('/api/communicator/models');
  if (!response.ok) {
    throw new Error('Failed to fetch models');
  }
  return response.json();
};

// Simple markdown to HTML converter for basic markdown features
const markdownToHtml = (markdown: string): string => {
  let html = markdown;

  // Process tables first (before other replacements)
  const lines = html.split('\n');
  const processedLines: string[] = [];
  let inTable = false;
  let tableRows: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isTableRow = line.trim().startsWith('|') && line.trim().endsWith('|');
    const isTableSeparator = /^\|[\s\-:]+\|/.test(line.trim());

    if (isTableRow && !isTableSeparator) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
        processedLines.push(
          '<table class="border-collapse border border-gray-300 dark:border-gray-600 w-full my-4">',
        );
      }
      const cells = line
        .split('|')
        .map((cell) => cell.trim())
        .filter((cell) => cell.length > 0);
      const isHeader =
        i > 0 && lines[i - 1] && /^\|[\s\-:]+\|/.test(lines[i - 1].trim());

      if (isHeader && tableRows.length === 0) {
        tableRows.push('<thead><tr>');
        cells.forEach((cell) => {
          tableRows.push(
            `<th class="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-700 font-semibold text-gray-900 dark:text-gray-100">${cell}</th>`,
          );
        });
        tableRows.push('</tr></thead><tbody>');
      } else {
        tableRows.push('<tr>');
        cells.forEach((cell) => {
          tableRows.push(
            `<td class="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-900 dark:text-gray-100">${cell}</td>`,
          );
        });
        tableRows.push('</tr>');
      }
    } else if (isTableSeparator) {
      // Skip separator lines
      continue;
    } else {
      if (inTable) {
        tableRows.push('</tbody></table>');
        processedLines.push(tableRows.join(''));
        tableRows = [];
        inTable = false;
      }
      processedLines.push(line);
    }
  }

  if (inTable) {
    tableRows.push('</tbody></table>');
    processedLines.push(tableRows.join(''));
  }

  html = processedLines.join('\n');

  // Headers
  html = html.replace(
    /^### (.*$)/gim,
    '<h3 class="text-xl font-semibold mt-4 mb-2 text-gray-900 dark:text-gray-100">$1</h3>',
  );
  html = html.replace(
    /^## (.*$)/gim,
    '<h2 class="text-2xl font-semibold mt-6 mb-3 text-gray-900 dark:text-gray-100">$1</h2>',
  );
  html = html.replace(
    /^# (.*$)/gim,
    '<h1 class="text-3xl font-bold mt-8 mb-4 text-gray-900 dark:text-gray-100">$1</h1>',
  );

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

  // Paragraphs (double line breaks)
  const paragraphs = html.split('\n\n');
  html = paragraphs
    .map((para) => {
      const trimmed = para.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<')) return trimmed; // Already HTML (tables, headers, etc.)
      // Replace single line breaks with <br> within paragraphs
      const withBreaks = trimmed.replace(/\n/g, '<br>');
      return `<p class="mb-4 text-gray-900 dark:text-gray-100">${withBreaks}</p>`;
    })
    .join('\n');

  return html;
};

const CommunicatorChat: NextPage = () => {
  const me = useUser();
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [question, setQuestion] = useState<string>('');
  const [queryResponse, setQueryResponse] = useState<QueryResponse | null>(
    null,
  );
  const [isQueryLoading, setIsQueryLoading] = useState<boolean>(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  const {
    data: modelsData,
    isLoading: modelsLoading,
    error: modelsError,
    refetch: refetchModels,
  } = useQuery<ModelsResponse, Error>('communicatorModels', fetchModels, {
    enabled: !!me && isAllowed(me, 'isSuperAdmin'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModel || !question.trim()) {
      return;
    }

    setIsQueryLoading(true);
    setQueryError(null);
    setQueryResponse(null);

    try {
      const response = await fetch('/api/communicator/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.trim(),
          model: selectedModel,
          includeRawData: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute query');
      }

      const data: QueryResponse = await response.json();
      setQueryResponse(data);
    } catch (error) {
      setQueryError(
        error instanceof Error ? error.message : 'An unknown error occurred',
      );
    } finally {
      setIsQueryLoading(false);
    }
  };

  // Set default model to gpt-oss-20b if available
  useEffect(() => {
    if (modelsData?.models) {
      const defaultModel = modelsData.models.find(
        (model) =>
          model.id.toLowerCase().includes('gpt-oss-20b') ||
          model.name.toLowerCase().includes('gpt-oss-20b') ||
          model.id.toLowerCase().includes('gpt oss 20b') ||
          model.name.toLowerCase().includes('gpt oss 20b'),
      );
      if (defaultModel) {
        setSelectedModel(defaultModel.id);
      } else {
        setSelectedModel('');
      }
    }
  }, [modelsData]);

  // Show loading while checking authentication
  if (me === undefined) {
    return <Loading />;
  }

  // Show warning page if user is not signed in or doesn't have isSuperAdmin permission
  if (!me || !isAllowed(me, 'isSuperAdmin')) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 dark:border-yellow-400 text-yellow-700 dark:text-yellow-300 p-4 rounded">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-lg">
            {!me
              ? 'You must be signed in to access the Communicator Chat. Please sign in to continue.'
              : 'You do not have permission to access the Communicator Chat. This page requires Super Admin privileges.'}
          </p>
        </div>
      </div>
    );
  }

  const models = modelsData?.models || [];
  const isGptOss20bAvailable = selectedModel !== '';

  return (
    <div>
      <h1>Communicator Chat</h1>

      {modelsLoading ? (
        <div className="mt-4">
          <p className="text-gray-900 dark:text-gray-100">Loading...</p>
        </div>
      ) : modelsError ? (
        <div className="mt-4">
          <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-400 text-red-700 dark:text-red-300 p-4 rounded mb-4">
            <p className="font-semibold">Error loading service</p>
            <p>{modelsError.message}</p>
            <GradientButton onClick={() => refetchModels()} className="mt-2">
              Retry
            </GradientButton>
          </div>
        </div>
      ) : !isGptOss20bAvailable ? (
        <div className="mt-4">
          <div className="bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 dark:border-yellow-400 text-yellow-700 dark:text-yellow-300 p-4 rounded mb-4">
            <p className="font-semibold text-lg">
              This service is not currently available
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Query</h2>
          <form onSubmit={handleQuerySubmit} className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter your question..."
                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                disabled={isQueryLoading}
              />
              <GradientButton
                type="submit"
                disabled={isQueryLoading || !question.trim()}
              >
                {isQueryLoading ? 'Querying...' : 'Query'}
              </GradientButton>
            </div>
          </form>

          {isQueryLoading && (
            <div className="flex items-center justify-center p-8">
              <Loading />
            </div>
          )}

          {queryError && (
            <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-400 text-red-700 dark:text-red-300 p-4 rounded mb-4">
              <p className="font-semibold">Error</p>
              <p>{queryError}</p>
            </div>
          )}

          {queryResponse && (
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="prose max-w-none dark:prose-invert">
                <div
                  dangerouslySetInnerHTML={{
                    __html: markdownToHtml(queryResponse.explanation),
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommunicatorChat;
