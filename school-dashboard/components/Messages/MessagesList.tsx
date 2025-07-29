import React from 'react';
import SingleMessageInList from './SingleMessageInList';

interface Message {
  id: string;
  subject: string;
  message: string;
  read: boolean;
  link?: string;
  sent: string;
  sender: {
    id: string;
    name: string;
  };
}

interface MessagesListProps {
  messages: Message[];
  onClose?: () => void;
}

const MessagesList: React.FC<MessagesListProps> = ({
  messages,
  onClose = () => {},
}) => {
  // console.log(messages);
  return (
    <div className="fixed top-0 right-0 h-full w-full max-w-md z-40 bg-gradient-to-tl from-[var(--red)] to-[var(--blue)] border-l-4 border-gray-400 shadow-2xl flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-300">
        <h3 className="text-white text-2xl font-bold">Messages</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-white text-3xl font-extrabold bg-black bg-opacity-40 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-70 focus:outline-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <div className="flex-1 overflow-y-auto flex flex-col p-4 gap-2">
        {messages.map((message) => (
          // console.log(message);
          (<SingleMessageInList key={message.id} message={message} />)
        ))}
      </div>
    </div>
  );
};

export default MessagesList;
