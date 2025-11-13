import React from 'react';

interface MessagePreviewCardProps {
  question: string;
  timestamp: string | null;
  createdAt: string | null;
  isSelected: boolean;
  onClick: () => void;
  userName?: string;
  showUserName?: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

const MessagePreviewCard: React.FC<MessagePreviewCardProps> = ({
  question,
  timestamp,
  createdAt,
  isSelected,
  onClick,
  userName,
  showUserName,
  hasError,
  errorMessage,
}) => {
  // Use timestamp if available, otherwise fall back to createdAt
  const dateToShow = timestamp || createdAt;
  const displayDate = dateToShow
    ? new Date(dateToShow).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'No date';

  // Truncate question if too long
  const truncatedQuestion =
    question.length > 100 ? `${question.substring(0, 100)}...` : question;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-colors ${
        hasError
          ? isSelected
            ? 'bg-red-100 dark:bg-red-900/30 border-red-500 dark:border-red-400'
            : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/30'
          : isSelected
            ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
      }`}
    >
      <div className="flex items-start gap-2 mb-1">
        {hasError && (
          <span className="text-red-600 dark:text-red-400 text-sm flex-shrink-0 mt-0.5">
            ⚠️
          </span>
        )}
        <p
          className={`text-sm font-medium flex-1 ${
            hasError
              ? isSelected
                ? 'text-red-900 dark:text-red-100'
                : 'text-red-800 dark:text-red-200'
              : isSelected
                ? 'text-blue-900 dark:text-blue-100'
                : 'text-gray-900 dark:text-gray-100'
          }`}
        >
          {truncatedQuestion}
        </p>
      </div>
      {hasError && errorMessage && (
        <p
          className={`text-xs mb-1 line-clamp-2 ${
            isSelected
              ? 'text-red-700 dark:text-red-300'
              : 'text-red-600 dark:text-red-400'
          }`}
        >
          {errorMessage}
        </p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <p
          className={`text-xs ${
            hasError
              ? isSelected
                ? 'text-red-700 dark:text-red-300'
                : 'text-red-600 dark:text-red-400'
              : isSelected
                ? 'text-blue-700 dark:text-blue-300'
                : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {displayDate}
        </p>
        {showUserName && userName && (
          <>
            <span
              className={`text-xs ${
                hasError
                  ? isSelected
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-red-600 dark:text-red-400'
                  : isSelected
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              •
            </span>
            <p
              className={`text-xs font-medium ${
                hasError
                  ? isSelected
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-red-600 dark:text-red-400'
                  : isSelected
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              {userName}
            </p>
          </>
        )}
      </div>
    </button>
  );
};

export default MessagePreviewCard;

