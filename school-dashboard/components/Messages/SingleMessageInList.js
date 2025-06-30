import React, { useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from 'react-query';
import useMarkMessageRead from './MarkMessageRead';
import useDeleteMessage from './useDeleteMessage';

export default function SingleMessageInList({ message }) {
  const markMessageRead = useMarkMessageRead();
  const deleteMessage = useDeleteMessage();
  const queryClient = useQueryClient();
  const [viewMessage, setViewMessage] = useState(false);
  const date = new Date(message.sent).toLocaleDateString();
  // console.log(message);
  return (
    <div className="my-2 mx-0">
      <div className="rounded-lg shadow bg-white/90 dark:bg-gray-800/80 p-4 break-words overflow-x-auto relative">
        <div className="flex items-center justify-between mb-2">
          <h3
            className={`font-bold text-lg ${message.read ? 'text-gray-800 dark:text-gray-100' : 'text-blue-700 dark:text-blue-400 font-extrabold'}`}
            onClick={async () => {
              setViewMessage(!viewMessage);
              const res = await markMessageRead({ variables: { id: message.id } });
            }}
            style={{ cursor: 'pointer' }}
          >
            {message.subject}
            <span className="ml-2 text-xs font-normal text-gray-500">{message.read ? 'read' : 'unread'}</span>
          </h3>
          <span className="text-xs text-gray-400">{date}</span>
        </div>
        {viewMessage && (
          <div className="mt-2 space-y-2">
            <div className="text-gray-900 dark:text-gray-100 whitespace-pre-line">{message.message}</div>
            {message.link && <Link href={message.link} className="text-blue-600 underline">View</Link>}
            <button
              type="button"
              onClick={async () => {
                const res = await deleteMessage({ variables: { id: message.id } });
                queryClient.refetchQueries('myMessages');
              }}
              className="absolute bottom-3 right-3 bg-red-600 hover:bg-red-700 text-white border-none p-2 text-base rounded-full cursor-pointer shadow"
              aria-label="Delete message"
            >
              &times;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
