import React from 'react';
import SingleCallbackCard from './SingleCallbackCard';

interface Callback {
  id: string;
  teacher: {
    id: string;
    name: string;
  };
  student: {
    name: string;
    preferredName: string;
    id: string;
  };
  link: string;
  description: string;
  title: string;
  dateAssigned: string;
  dateCompleted?: string;
  messageFromStudent?: string;
  messageFromTeacher?: string;
  messageFromStudentDate?: string;
  messageFromTeacherDate?: string;
}

interface CallbackCardsProps {
  callbacks: Callback[];
  maxColumns?: number;
}

const CallbackCards: React.FC<CallbackCardsProps> = ({
  callbacks,
  maxColumns,
}) => {
  return (
    <>
      <h1>
        You have {callbacks?.length > 0 ? callbacks.length : 'no'} Items on
        callback
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 transition-all duration-1000 ease-in">
        {callbacks?.map((callback) => (
          <SingleCallbackCard
            callback={callback}
            key={`Callback${callback.id}`}
          />
        ))}
      </div>
    </>
  );
};

export default CallbackCards;
