import React from 'react';

interface MessagePreviewCardProps {
  question: string;
  timestamp: string | null;
  createdAt: string | null;
  isSelected: boolean;
  onClick: () => void;
}

const MessagePreviewCard: React.FC<MessagePreviewCardProps> = ({
  question,
  timestamp,
  createdAt,
  isSelected,
  onClick,
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
        isSelected
          ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
      }`}
    >
      <p
        className={`text-sm font-medium mb-1 ${
          isSelected
            ? 'text-blue-900 dark:text-blue-100'
            : 'text-gray-900 dark:text-gray-100'
        }`}
      >
        {truncatedQuestion}
      </p>
      <p
        className={`text-xs ${
          isSelected
            ? 'text-blue-700 dark:text-blue-300'
            : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        {displayDate}
      </p>
    </button>
  );
};

export default MessagePreviewCard;

