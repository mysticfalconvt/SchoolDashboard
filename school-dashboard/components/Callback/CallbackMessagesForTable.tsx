import { useUser } from '@/components/User';
import { useGqlMutation } from '@/lib/useGqlMutation';
import React, { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useQueryClient } from 'react-query';
import { UPDATE_CALLBACK_MESSAGES_MUTATION } from './CallbackCardMessages';

interface Teacher {
  id: string;
}

interface Student {
  id: string;
  name: string;
}

interface CallbackItem {
  id: string;
  teacher: Teacher;
  student: Student;
  messageFromTeacher?: string;
  messageFromTeacherDate?: string;
  messageFromStudent?: string;
  messageFromStudentDate?: string;
}

interface CallbackMessagesForTableProps {
  callbackItem: CallbackItem;
}

const CallbackMessagesForTable = React.memo(function CallbackMessagesForTable({
  callbackItem,
}: CallbackMessagesForTableProps) {
  const me = useUser();
  const queryClient = useQueryClient();
  const isTeacher = me.id === callbackItem.teacher.id;
  const isStudent = me.id === callbackItem.student.id;
  const currentDate = useMemo(() => new Date().toLocaleDateString(), []);
  const [teacherMessage, setTeacherMessage] = useState(
    callbackItem.messageFromTeacher || '',
  );
  const [studentMessage, setStudentMessage] = useState(
    callbackItem.messageFromStudent || '',
  );
  const [teacherMessageDate, setTeacherMessageDate] = useState(
    callbackItem.messageFromTeacherDate || '',
  );
  const [studentMessageDate, setStudentMessageDate] = useState(
    callbackItem.messageFromStudentDate || '',
  );
  const [updateCallback] = useGqlMutation(UPDATE_CALLBACK_MESSAGES_MUTATION);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateCallback({
        id: callbackItem.id,
        messageFromTeacher: teacherMessage,
        messageFromTeacherDate: teacherMessageDate,
        messageFromStudent: studentMessage,
        messageFromStudentDate: studentMessageDate,
      });
      
      // Invalidate specific queries to trigger refetch - avoid refetching ALL queries
      queryClient.invalidateQueries(['taInfo']);
      queryClient.invalidateQueries(['allCallbacks']);
      
      toast.success(`Updated Callback Message for ${callbackItem.student.name}`);
    } catch (error) {
      toast.error('Failed to update message');
      console.error(error);
    }
  };

  const submitOnEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey === false) {
      handleSubmit(e);
    }
  };

  return (
    <div className="grid grid-cols-2 justify-start items-start">
      <div className="flex flex-col items-center h-full justify-between m-0.5 p-0.5 rounded-lg text-xl leading-6">
        <span className="text-2xl leading-6 py-0.5 px-2">Teacher</span>
        {!isTeacher && (
          <>
            <span className="text-xl leading-6 py-0.5 px-2">
              {teacherMessage}
            </span>
            <span className="text-xs">{teacherMessageDate}</span>
          </>
        )}
        {isTeacher && (
          <>
            <textarea
              placeholder="message"
              value={teacherMessage}
              title="Enter to submit change, Shift-Enter for new line"
              onKeyDown={submitOnEnter}
              className="w-full py-0 px-2 m-0 bg-inherit text-inherit overflow-hidden"
              onChange={(e) => {
                setTeacherMessage(e.target.value);
                setTeacherMessageDate(currentDate);
              }}
            />
            <span className="text-xs">{teacherMessageDate}</span>
          </>
        )}
      </div>
      <div className="flex flex-col items-center h-full justify-between m-0.5 p-0.5 rounded-lg text-xl leading-6">
        <span className="text-2xl leading-6 py-0.5 px-2">Student</span>
        {!isStudent && (
          <>
            <span className="text-xl leading-6 py-0.5 px-2">
              {studentMessage}
            </span>
            <span className="text-xs">{studentMessageDate}</span>
          </>
        )}
        {isStudent && (
          <>
            <textarea
              placeholder="message"
              value={studentMessage}
              title="Enter to submit change, Shift-Enter for new line"
              onKeyDown={submitOnEnter}
              className="w-full py-0 px-2 m-0 bg-inherit text-inherit overflow-hidden"
              onChange={(e) => {
                setStudentMessage(e.target.value);
                setStudentMessageDate(currentDate);
              }}
            />
            <span className="text-xs">{studentMessageDate}</span>
          </>
        )}
      </div>
    </div>
  );
});

export default CallbackMessagesForTable;
