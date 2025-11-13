import gql from 'graphql-tag';
import type { NextPage } from 'next';
import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import MessagePreviewCard from '../components/communicator/MessagePreviewCard';
import QueryLoadingSpinner from '../components/communicator/QueryLoadingSpinner';
import Loading from '../components/Loading';
import GradientButton from '../components/styles/Button';
import { FormDialog } from '../components/styles/Dialog';
import { useUser } from '../components/User';
import isAllowed from '../lib/isAllowed';
import { markdownToHtml } from '../lib/markdownToHtml';
import { useGqlMutation } from '../lib/useGqlMutation';
import { useGQLQuery } from '../lib/useGqlQuery';

interface Model {
  id: string;
  name: string;
  available: boolean;
}

interface ModelsResponse {
  models: Model[];
}

interface QueryResponse {
  id?: string;
  question: string;
  explanation?: string;
  graphqlQuery?: string;
  timestamp?: string | null;
  createdAt?: string | null;
  iterations?: number;
  evaluationScore?: number;
  rawData?: any;
  model?: string;
  userRating?: number;
  userComment?: string;
  // Error fields
  error?: boolean;
  message?: string;
  details?: string;
  status?: number;
  errorMessage?: string;
  hasError?: string;
}

interface CommunicatorMessage {
  id: string;
  question: string;
  explanation?: string;
  graphqlQuery?: string;
  timestamp?: string | null;
  createdAt?: string | null;
  iterations?: number;
  evaluationScore?: number;
  rawData?: any;
  model?: string;
  userRating?: number;
  userComment?: string;
  errorMessage?: string;
  hasError?: string;
}

interface CommunicatorMessageListData {
  communicatorChats: CommunicatorMessage[];
}

interface CommunicatorQueryData {
  queryCommunicator: QueryResponse;
}

interface CommunicatorQueryVariables {
  question: string;
  model: string;
}

const COMMUNICATOR_QUERY_MUTATION = gql`
  mutation QueryCommunicator($question: String!, $model: String!) {
    queryCommunicator(question: $question, model: $model)
  }
`;

const QUERY_COMMUNICATOR_MESSAGE_LIST = gql`
  query QueryCommunicatorMessageList($userId: ID) {
    communicatorChats(where: { user: { id: { equals: $userId } } }) {
      id
      question
      explanation
      graphqlQuery
      timestamp
      createdAt
      iterations
      evaluationScore
      rawData
      model
      userRating
      userComment
      errorMessage
      hasError
    }
  }
`;

const QUERY_ALL_COMMUNICATOR_MESSAGES = gql`
  query QueryAllCommunicatorMessages {
    communicatorChats {
      id
      question
      explanation
      graphqlQuery
      timestamp
      createdAt
      iterations
      evaluationScore
      rawData
      model
      userRating
      userComment
      errorMessage
      hasError
    }
  }
`;

const UPDATE_COMMUNICATOR_CHAT_RATING = gql`
  mutation UpdateCommunicatorChatRating(
    $id: ID!
    $userRating: Int!
    $userComment: String
  ) {
    updateCommunicatorChat(
      where: { id: $id }
      data: { userRating: $userRating, userComment: $userComment }
    ) {
      id
      userRating
      userComment
    }
  }
`;

const fetchModels = async (): Promise<ModelsResponse> => {
  const response = await fetch('/api/communicator/models');
  if (!response.ok) {
    throw new Error('Failed to fetch models');
  }
  return response.json();
};

const CommunicatorChat: NextPage = () => {
  const me = useUser();
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [question, setQuestion] = useState<string>('');
  const [queryResponse, setQueryResponse] = useState<QueryResponse | null>(
    null,
  );
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null,
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [detailsField, setDetailsField] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState<boolean>(false);
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState<string>('');
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [userFriendlyError, setUserFriendlyError] = useState<string | null>(
    null,
  );
  const [lastFailedQuestion, setLastFailedQuestion] = useState<string | null>(
    null,
  );
  const [copied, setCopied] = useState<boolean>(false);
  const [detailsTab, setDetailsTab] = useState<'query' | 'rawData'>('query');

  const isSuperAdmin = isAllowed(me, 'isSuperAdmin');
  const queryToUse = isSuperAdmin
    ? QUERY_ALL_COMMUNICATOR_MESSAGES
    : QUERY_COMMUNICATOR_MESSAGE_LIST;
  const queryVariables = isSuperAdmin ? {} : { userId: me?.id || '' };

  const {
    data: messagesData,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useGQLQuery<CommunicatorMessageListData>(
    `communicatorMessages-${isSuperAdmin ? 'all' : me?.id || ''}`,
    queryToUse,
    queryVariables,
    {
      enabled:
        !!me &&
        isAllowed(me, 'isCommunicatorEnabled') &&
        (isSuperAdmin || !!me.id),
      staleTime: 30 * 1000, // 30 seconds
    },
  );

  const [, { data, loading: isQueryLoading, error, mutateAsync }] =
    useGqlMutation<CommunicatorQueryData, CommunicatorQueryVariables>(
      COMMUNICATOR_QUERY_MUTATION,
      {
        onSuccess: () => {
          // Clear any previous errors on success
          setUserFriendlyError(null);
          // Refetch messages list after successful mutation
          refetchMessages();
        },
        onError: (error) => {
          // This handles network/GraphQL errors (when mutation throws)
          // Backend errors are now returned in the response, not thrown
          setUserFriendlyError('Sorry, the request failed. Please try again.');
          // Clear pending question on error
          setPendingQuestion(null);
          // Store the question from the input field if available for retry
          // (This is a fallback for network errors where we don't get a response)
        },
      },
    );

  const [updateRating, { loading: isUpdatingRating }] = useGqlMutation<
    {
      updateCommunicatorChat: {
        id: string;
        userRating: number;
        userComment: string;
      };
    },
    { id: string; userRating: number; userComment?: string }
  >(UPDATE_COMMUNICATOR_CHAT_RATING, {
    onSuccess: () => {
      // Refetch messages to get updated rating
      refetchMessages();
      // Update the current queryResponse if it's the same message
      if (queryResponse?.id) {
        refetchMessages().then(() => {
          // The useEffect will update queryResponse when messagesData changes
        });
      }
      setShowRatingModal(false);
      setRatingComment('');
    },
  });

  const {
    data: modelsData,
    isLoading: modelsLoading,
    error: modelsError,
    refetch: refetchModels,
  } = useQuery<ModelsResponse, Error>('communicatorModels', fetchModels, {
    enabled: !!me && isAllowed(me, 'isCommunicatorEnabled'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModel || !question.trim()) {
      return;
    }

    const questionText = question.trim();

    // Clear current response and selection
    setQueryResponse(null);
    setSelectedMessageId(null);
    // Store the question we're asking so we can find it later
    setPendingQuestion(questionText);

    try {
      // Clear any previous errors
      setUserFriendlyError(null);

      await mutateAsync({
        question: questionText,
        model: selectedModel,
      });

      // After mutation succeeds, wait a bit for the backend to save, then refetch
      // and find the new message
      setTimeout(async () => {
        await refetchMessages();
      }, 500);
    } catch (error) {
      // Error is already handled by onError callback, but log it for debugging
      console.error('Error executing communicator query:', error);
      setPendingQuestion(null);
    }
  };

  // Update queryResponse when data changes (new query response)
  useEffect(() => {
    if (data?.queryCommunicator) {
      const response = data.queryCommunicator;

      // Check if the response contains an error
      if (response.error) {
        // Handle error response from backend
        // Still set queryResponse so we can display the error in the message view
        setQueryResponse(response);
        // Store the question so we can retry it
        if (response.question) {
          setLastFailedQuestion(response.question);
        }
        setUserFriendlyError(
          response.message || 'Sorry, the request failed. Please try again.',
        );
        setPendingQuestion(null);
        // Still refetch messages so the error is saved to the list
        setTimeout(async () => {
          await refetchMessages();
        }, 500);
        return;
      }

      // Clear any previous errors on successful response
      setUserFriendlyError(null);
      setLastFailedQuestion(null);

      // Set the response immediately from the mutation result
      setQueryResponse(response);

      // After a short delay, refetch messages and find the matching one
      const timeoutId = setTimeout(async () => {
        await refetchMessages();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [data, refetchMessages]);

  // When messages are refetched after a new query, find and select the new message
  useEffect(() => {
    if (messagesData?.communicatorChats && pendingQuestion) {
      // Find the message that matches the question we just asked
      const matchingMessages = messagesData.communicatorChats.filter(
        (msg) => msg.question === pendingQuestion,
      );

      if (matchingMessages.length > 0) {
        // Sort by date to get the most recent one
        const sortedMatches = [...matchingMessages].sort((a, b) => {
          const dateA = new Date(a.timestamp || a.createdAt || 0).getTime();
          const dateB = new Date(b.timestamp || b.createdAt || 0).getTime();
          return dateB - dateA;
        });

        const newestMatch = sortedMatches[0];
        setSelectedMessageId(newestMatch.id);
        setQueryResponse(newestMatch as QueryResponse);
        // Clear pending question since we found it
        setPendingQuestion(null);
      }
    }
  }, [messagesData, pendingQuestion]);

  // Update queryResponse when messagesData changes (e.g., after rating update)
  // Only update if we're not waiting for a new question
  useEffect(() => {
    if (
      queryResponse?.id &&
      messagesData?.communicatorChats &&
      !pendingQuestion
    ) {
      const updatedMessage = messagesData.communicatorChats.find(
        (msg) => msg.id === queryResponse.id,
      );
      if (updatedMessage) {
        setQueryResponse(updatedMessage as QueryResponse);
      }
    }
  }, [messagesData, queryResponse?.id, pendingQuestion]);

  // Handle clicking on a message card
  const handleMessageClick = (message: CommunicatorMessage) => {
    setSelectedMessageId(message.id);
    setQueryResponse(message as QueryResponse);
  };

  const messages = messagesData?.communicatorChats || [];
  // Filter out error messages (hasError === 'true') from the sidebar
  // Users can still see them if they navigate to them, but they won't clutter the list
  const successfulMessages = messages.filter((msg) => msg.hasError !== 'true');
  // Sort messages by date (newest first)
  const sortedMessages = [...successfulMessages].sort((a, b) => {
    const dateA = new Date(a.timestamp || a.createdAt || 0).getTime();
    const dateB = new Date(b.timestamp || b.createdAt || 0).getTime();
    return dateB - dateA;
  });

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
  if (!me || !isAllowed(me, 'isCommunicatorEnabled')) {
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
    <div className="h-screen flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Communicator Chat
        </h1>
      </div>

      {modelsLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loading />
        </div>
      ) : modelsError ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-400 text-red-700 dark:text-red-300 p-4 rounded">
            <p className="font-semibold">Error loading service</p>
            <p>{modelsError.message}</p>
            <GradientButton onClick={() => refetchModels()} className="mt-2">
              Retry
            </GradientButton>
          </div>
        </div>
      ) : !isGptOss20bAvailable ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 dark:border-yellow-400 text-yellow-700 dark:text-yellow-300 p-4 rounded">
            <p className="font-semibold text-lg">
              This service is not currently available
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden relative">
          {/* Sidebar */}
          <div
            className={`${
              sidebarCollapsed
                ? 'hidden md:flex md:w-0'
                : 'flex w-full md:w-1/4'
            } ${
              sidebarCollapsed
                ? ''
                : 'absolute md:relative z-10 h-full bg-white dark:bg-gray-900'
            } min-w-[100px] max-w-[25vw] border-r border-gray-200 dark:border-gray-700 flex-col transition-all duration-300`}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Messages
              </h2>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="md:hidden text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                aria-label={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
              >
                {sidebarCollapsed ? '☰' : '✕'}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messagesLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loading />
                </div>
              ) : sortedMessages.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
                  No messages yet
                </p>
              ) : (
                sortedMessages.map((message) => (
                  <MessagePreviewCard
                    key={message.id}
                    question={message.question}
                    timestamp={message.timestamp}
                    createdAt={message.createdAt}
                    isSelected={selectedMessageId === message.id}
                    onClick={() => handleMessageClick(message)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <form onSubmit={handleQuerySubmit} className="flex gap-2">
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
                {sidebarCollapsed && (
                  <button
                    type="button"
                    onClick={() => setSidebarCollapsed(false)}
                    className="md:hidden px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    ☰
                  </button>
                )}
              </form>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {isQueryLoading ? (
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <QueryLoadingSpinner />
                </div>
              ) : error || userFriendlyError ? (
                <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-400 text-red-700 dark:text-red-300 p-4 rounded-lg">
                  <p className="font-semibold text-lg mb-2">
                    Sorry, something went wrong
                  </p>
                  <p className="mb-4">
                    {userFriendlyError ||
                      'The request failed. Please try again.'}
                  </p>
                  {(queryResponse?.question || lastFailedQuestion) && (
                    <button
                      onClick={async () => {
                        const questionToRetry =
                          queryResponse?.question || lastFailedQuestion;
                        if (!selectedModel || !questionToRetry) {
                          return;
                        }
                        // Clear errors
                        setUserFriendlyError(null);
                        setQueryResponse(null);
                        setSelectedMessageId(null);
                        setPendingQuestion(questionToRetry);
                        setLastFailedQuestion(null);

                        // Re-submit the question
                        try {
                          await mutateAsync({
                            question: questionToRetry,
                            model: selectedModel,
                          });
                        } catch (error) {
                          console.error('Error re-asking question:', error);
                        }
                      }}
                      disabled={isQueryLoading}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isQueryLoading ? 'Retrying...' : 'Try Again'}
                    </button>
                  )}
                  {!queryResponse?.question && !lastFailedQuestion && (
                    <button
                      onClick={() => {
                        setUserFriendlyError(null);
                        setQueryResponse(null);
                        setSelectedMessageId(null);
                        setLastFailedQuestion(null);
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                    >
                      Clear Error
                    </button>
                  )}
                </div>
              ) : queryResponse ? (
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  {/* Show error message if this is an error response */}
                  {(queryResponse.hasError === 'true' ||
                    queryResponse.error) && (
                    <div className="mb-6 pb-4 border-b border-red-300 dark:border-red-600">
                      <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-400 text-red-700 dark:text-red-300 p-4 rounded">
                        <p className="font-semibold text-lg mb-2">
                          Error occurred
                        </p>
                        <p className="mb-2">
                          {queryResponse.errorMessage ||
                            queryResponse.message ||
                            'An error occurred while processing this request.'}
                        </p>
                        {queryResponse.details && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-sm font-medium">
                              Technical details
                            </summary>
                            <pre className="mt-2 text-xs bg-red-50 dark:bg-red-900/50 p-2 rounded overflow-x-auto">
                              {queryResponse.details}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Question Header */}
                  <div className="mb-6 pb-4 border-b border-gray-300 dark:border-gray-600">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                          {queryResponse.question}
                        </h2>
                        {queryResponse.timestamp && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(queryResponse.timestamp).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={async () => {
                          if (!selectedModel || !queryResponse.question) {
                            return;
                          }
                          setQueryResponse(null);
                          setSelectedMessageId(null);
                          try {
                            await mutateAsync({
                              question: queryResponse.question,
                              model: selectedModel,
                            });
                          } catch (error) {
                            console.error('Error re-asking question:', error);
                          }
                        }}
                        disabled={isQueryLoading}
                        className="flex-shrink-0 p-2 square rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Re-ask this question"
                        aria-label="Re-ask this question"
                      >
                        <span className="text-xl">
                          {isQueryLoading ? '⏳' : '🔄'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Explanation Content - only show if not an error */}
                  {queryResponse.explanation &&
                    queryResponse.hasError !== 'true' &&
                    !queryResponse.error && (
                      <div className="prose max-w-none dark:prose-invert mb-6">
                        <div
                          dangerouslySetInnerHTML={{
                            __html: markdownToHtml(queryResponse.explanation),
                          }}
                        />
                      </div>
                    )}

                  {/* Detail Icons - only show if not an error */}
                  {queryResponse.hasError !== 'true' &&
                    !queryResponse.error && (
                      <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                        {queryResponse.iterations !== undefined && (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                            <span className="text-xl">🔄</span>
                            <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                              Iterations: {queryResponse.iterations}
                            </span>
                          </div>
                        )}
                        {queryResponse.evaluationScore !== undefined && (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                            <span className="text-xl">⭐</span>
                            <span className="text-sm font-medium text-green-900 dark:text-green-100">
                              Score: {queryResponse.evaluationScore}
                            </span>
                          </div>
                        )}
                        {queryResponse.model && (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                            <span className="text-xl">🤖</span>
                            <span className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                              {queryResponse.model}
                            </span>
                          </div>
                        )}
                        {queryResponse.timestamp && (
                          <button
                            onClick={() => {
                              setDetailsField('timestamp');
                              setShowDetailsModal(true);
                            }}
                            className="group relative flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            title={`Timestamp: ${new Date(queryResponse.timestamp).toLocaleString()}`}
                          >
                            <span className="text-xl">🕐</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              Timestamp
                            </span>
                          </button>
                        )}
                        {(queryResponse.graphqlQuery ||
                          queryResponse.rawData) && (
                          <button
                            onClick={() => {
                              setDetailsField('data');
                              setDetailsTab(
                                queryResponse.graphqlQuery
                                  ? 'query'
                                  : 'rawData',
                              );
                              setShowDetailsModal(true);
                            }}
                            className="group relative flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                            title="View GraphQL Query and Raw Data"
                          >
                            <span className="text-xl">📊</span>
                            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                              Data
                            </span>
                          </button>
                        )}
                      </div>
                    )}

                  {/* Rating Section - only show if not an error */}
                  {queryResponse.id &&
                    queryResponse.hasError !== 'true' &&
                    !queryResponse.error &&
                    (queryResponse.userRating === undefined ||
                      queryResponse.userRating === null ||
                      queryResponse.userRating === 0) && (
                      <div className="mt-6 pt-4 border-t border-gray-300 dark:border-gray-600">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Rate this response:
                        </p>
                        <div className="flex gap-4">
                          <button
                            onClick={() => {
                              setRatingValue(1);
                              setRatingComment('');
                              setShowRatingModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                            title="Thumbs down - Rate this response"
                          >
                            <span className="text-2xl">👎</span>
                            <span className="text-sm font-medium text-red-900 dark:text-red-100">
                              Thumbs Down
                            </span>
                          </button>
                          <button
                            onClick={() => {
                              setRatingValue(10);
                              setRatingComment('');
                              setShowRatingModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                            title="Thumbs up - Rate this response"
                          >
                            <span className="text-2xl">👍</span>
                            <span className="text-sm font-medium text-green-900 dark:text-green-100">
                              Thumbs Up
                            </span>
                          </button>
                        </div>
                      </div>
                    )}

                  {/* Show existing rating if rated - only show if not an error */}
                  {queryResponse.id &&
                    queryResponse.hasError !== 'true' &&
                    !queryResponse.error &&
                    queryResponse.userRating !== undefined &&
                    queryResponse.userRating !== null &&
                    queryResponse.userRating > 0 && (
                      <div className="mt-6 pt-4 border-t border-gray-300 dark:border-gray-600">
                        <button
                          onClick={() => {
                            setRatingValue(queryResponse.userRating || 5);
                            setRatingComment(queryResponse.userComment || '');
                            setShowRatingModal(true);
                          }}
                          className="w-full text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-3 transition-colors"
                          title="Click to update your rating"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">
                              {queryResponse.userRating >= 5 ? '👍' : '👎'}
                            </span>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              Your rating: {queryResponse.userRating}/10
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                              (Click to update)
                            </span>
                          </div>
                          {queryResponse.userComment && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                              "{queryResponse.userComment}"
                            </p>
                          )}
                        </button>
                      </div>
                    )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <p>Select a message or ask a new question</p>
                </div>
              )}

              {/* Rating Modal */}
              <FormDialog
                isOpen={showRatingModal}
                onClose={() => {
                  setShowRatingModal(false);
                  setRatingComment('');
                }}
                title="Rate this response"
                size="md"
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Rating (1-10):
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={ratingValue}
                        onChange={(e) =>
                          setRatingValue(parseInt(e.target.value))
                        }
                        className="flex-1"
                      />
                      <span className="text-lg font-semibold text-gray-900 dark:text-gray-100 w-12 text-center">
                        {ratingValue}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>1 (Poor)</span>
                      <span>10 (Excellent)</span>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="rating-comment"
                      className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2"
                    >
                      Comment (optional):
                    </label>
                    <textarea
                      id="rating-comment"
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      rows={4}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      placeholder="Add any comments about this response..."
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-4">
                    <button
                      onClick={() => {
                        setShowRatingModal(false);
                        setRatingComment('');
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      disabled={isUpdatingRating}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        if (!queryResponse?.id) return;
                        try {
                          await updateRating({
                            id: queryResponse.id,
                            userRating: ratingValue,
                            userComment: ratingComment.trim() || undefined,
                          });
                        } catch (error) {
                          console.error('Error updating rating:', error);
                        }
                      }}
                      disabled={isUpdatingRating}
                      className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdatingRating ? 'Submitting...' : 'Submit'}
                    </button>
                  </div>
                </div>
              </FormDialog>

              {/* Details Modal */}
              <FormDialog
                isOpen={showDetailsModal}
                onClose={() => {
                  setShowDetailsModal(false);
                  setDetailsField(null);
                  setCopied(false);
                  setDetailsTab('query');
                }}
                title={
                  detailsField === 'data'
                    ? 'Data'
                    : detailsField === 'timestamp'
                      ? 'Timestamp'
                      : 'Details'
                }
                size="lg"
              >
                <div className="space-y-4">
                  {/* Show tabs if both graphqlQuery and rawData are available */}
                  {detailsField === 'data' &&
                    queryResponse?.graphqlQuery &&
                    queryResponse?.rawData && (
                      <div className="flex border-b border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => setDetailsTab('query')}
                          className={`px-4 py-2 font-medium text-sm transition-colors ${
                            detailsTab === 'query'
                              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                          }`}
                        >
                          GraphQL Query
                        </button>
                        <button
                          onClick={() => setDetailsTab('rawData')}
                          className={`px-4 py-2 font-medium text-sm transition-colors ${
                            detailsTab === 'rawData'
                              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                          }`}
                        >
                          Raw Data
                        </button>
                      </div>
                    )}

                  {detailsField === 'data' && (
                    <div className="flex justify-end mb-2">
                      <button
                        onClick={async () => {
                          let textToCopy = '';
                          if (
                            detailsTab === 'query' &&
                            queryResponse?.graphqlQuery
                          ) {
                            textToCopy = queryResponse.graphqlQuery;
                          } else if (
                            detailsTab === 'rawData' &&
                            queryResponse?.rawData
                          ) {
                            textToCopy = JSON.stringify(
                              queryResponse.rawData,
                              null,
                              2,
                            );
                          }
                          try {
                            await navigator.clipboard.writeText(textToCopy);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          } catch (err) {
                            console.error('Failed to copy:', err);
                          }
                        }}
                        className="px-3 py-1.5 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-2"
                      >
                        {copied ? (
                          <>
                            <span>✓</span>
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <span>📋</span>
                            <span>Copy to Clipboard</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  {detailsField === 'data' && (
                    <div className="relative">
                      {detailsTab === 'query' &&
                        queryResponse?.graphqlQuery && (
                          <pre className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 rounded-lg overflow-x-auto text-sm font-mono max-h-[70vh] overflow-y-auto">
                            <code className="text-gray-900 dark:text-gray-100">
                              {queryResponse.graphqlQuery}
                            </code>
                          </pre>
                        )}
                      {detailsTab === 'rawData' && queryResponse?.rawData && (
                        <pre className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 rounded-lg overflow-x-auto text-sm font-mono max-h-[70vh] overflow-y-auto">
                          <code className="text-gray-900 dark:text-gray-100">
                            {JSON.stringify(queryResponse.rawData, null, 2)}
                          </code>
                        </pre>
                      )}
                      {/* If only one is available, show it regardless of tab */}
                      {!queryResponse?.graphqlQuery &&
                        queryResponse?.rawData && (
                          <pre className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 rounded-lg overflow-x-auto text-sm font-mono max-h-[70vh] overflow-y-auto">
                            <code className="text-gray-900 dark:text-gray-100">
                              {JSON.stringify(queryResponse.rawData, null, 2)}
                            </code>
                          </pre>
                        )}
                      {queryResponse?.graphqlQuery &&
                        !queryResponse?.rawData && (
                          <pre className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 rounded-lg overflow-x-auto text-sm font-mono max-h-[70vh] overflow-y-auto">
                            <code className="text-gray-900 dark:text-gray-100">
                              {queryResponse.graphqlQuery}
                            </code>
                          </pre>
                        )}
                    </div>
                  )}
                  {detailsField === 'timestamp' && queryResponse?.timestamp && (
                    <div>
                      <p className="text-lg font-semibold mb-2">
                        Timestamp:{' '}
                        {new Date(queryResponse.timestamp).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ISO Format: {queryResponse.timestamp}
                      </p>
                    </div>
                  )}
                </div>
              </FormDialog>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicatorChat;
