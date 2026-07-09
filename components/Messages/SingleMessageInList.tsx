import Link from 'next/link';
import React, { useState } from 'react';
import { useQueryClient } from 'react-query';
import useMarkMessageRead from './MarkMessageRead';
import useDeleteMessage from './useDeleteMessage';

interface Message {
  id: string;
  subject: string;
  message: string;
  sent: string;
  read: boolean;
  link?: string;
}

interface SingleMessageInListProps {
  message: Message;
}

const SingleMessageInList: React.FC<SingleMessageInListProps> = ({
  message,
}) => {
  const markMessageRead = useMarkMessageRead();
  const deleteMessage = useDeleteMessage();
  const queryClient = useQueryClient();
  const [viewMessage, setViewMessage] = useState(false);
  const date = new Date(message.sent).toLocaleDateString();
  const hasBody = !!message.message && message.message.trim() !== '';

  const toggle = async () => {
    setViewMessage((v) => !v);
    if (!message.read) await markMessageRead({ id: message.id });
  };

  return (
    <div className="shrink-0 rounded-lg shadow bg-white/90 dark:bg-gray-800/80 break-words overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={viewMessage}
        className="w-full text-left flex items-start justify-between gap-3 p-4 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300"
      >
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate font-bold text-lg ${message.read ? 'text-gray-800 dark:text-gray-100' : 'text-blue-700 dark:text-blue-400 font-extrabold'}`}
          >
            {message.subject}
          </span>
          <span className="text-xs font-normal text-gray-500">
            {message.read ? 'read' : 'unread'}
          </span>
        </span>
        <span className="shrink-0 flex items-center gap-2 pt-1">
          <span className="text-xs text-gray-400 whitespace-nowrap">{date}</span>
          <span
            className={`text-gray-400 transition-transform duration-200 ${viewMessage ? 'rotate-180' : ''}`}
            aria-hidden
          >
            ▾
          </span>
        </span>
      </button>
      {viewMessage && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
          <div className="text-gray-900 dark:text-gray-100 whitespace-pre-line">
            {hasBody ? (
              message.message
            ) : (
              <span className="italic text-gray-400">No message content</span>
            )}
          </div>
          <div className="flex items-center justify-between gap-3">
            {message.link ? (
              <Link href={message.link} className="text-blue-600 underline">
                View
              </Link>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={async () => {
                await deleteMessage({ id: message.id });
                queryClient.refetchQueries('myMessages');
              }}
              className="shrink-0 inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white border-none py-1.5 px-3 text-sm rounded-full cursor-pointer shadow"
              aria-label="Delete message"
            >
              <span aria-hidden className="text-base leading-none">
                &times;
              </span>
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleMessageInList;
