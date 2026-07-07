import { SmallGradientButton } from '@/components/styles/Button';
import Form, { FormGroup } from '@/components/styles/Form';
import { useGqlMutation } from '@/lib/useGqlMutation';
import gql from 'graphql-tag';
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useQueryClient } from 'react-query';

export const UPDATE_CALLBACK_MESSAGES_MUTATION = gql`
  mutation UPDATE_CALLBACK_MESSAGES_MUTATION(
    $id: ID!
    $messageFromTeacher: String
    $messageFromTeacherDate: String
    $messageFromStudent: String
    $messageFromStudentDate: String
  ) {
    updateCallback(
      where: { id: $id }
      data: {
        messageFromTeacher: $messageFromTeacher
        messageFromTeacherDate: $messageFromTeacherDate
        messageFromStudent: $messageFromStudent
        messageFromStudentDate: $messageFromStudentDate
      }
    ) {
      id
    }
  }
`;

interface Teacher {
  id: string;
}

interface Student {
  id: string;
  name: string;
}

interface Callback {
  id: string;
  teacher: Teacher;
  student: Student;
  messageFromTeacher?: string;
  messageFromTeacherDate?: string;
  messageFromStudent?: string;
  messageFromStudentDate?: string;
}

interface User {
  id: string;
}

interface CallbackCardMessagesProps {
  me: User;
  callback: Callback;
}

interface MessageOption {
  key: string;
  value: string;
  selected?: boolean;
}

const studentDeleteMessage = 'Remove Message';
const studentMessageOptions = [
  'I am finished. Please check my work.',
  'I am stuck. I will come see you.',
  "I'm done with my work; when can I visit you to have it checked?",
];

export default function CallbackCardMessages({
  me,
  callback,
}: CallbackCardMessagesProps) {
  const isTeacher = me?.id === callback.teacher.id;
  const isStudent = me?.id === callback?.student?.id;
  // console.log(callback)
  const [teacherMessage, setTeacherMessage] = useState(
    callback.messageFromTeacher || '',
  );
  const [teacherMessageDate, setTeacherMessageDate] = useState(
    callback.messageFromTeacherDate || '',
  );
  const studentMessage = callback.messageFromStudent;

  const [studentMessageDate, setStudentMessageDate] = useState(
    callback.messageFromStudentDate || '',
  );
  // console.log(studentMessageDate)
  const queryClient = useQueryClient();
  const [updateCallback, { loading, error, data }] = useGqlMutation(
    UPDATE_CALLBACK_MESSAGES_MUTATION,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCallback({
      id: callback.id,
      messageFromTeacher: teacherMessage,
      messageFromTeacherDate: teacherMessageDate,
      messageFromStudent: studentMessage,
      messageFromStudentDate: studentMessageDate,
    });
    toast.success(`Updated Callback Message for ${callback.student.name}`);
  };

  const submitOnEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey === false) {
      handleSubmit(e);
    }
  };
  const handleSelectStudentMessage = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const studentMessage =
      e.target.value === studentDeleteMessage ? '' : e.target.value;
    const todaysDate = new Date().toLocaleDateString();
    await updateCallback({
      id: callback.id,
      messageFromTeacher: teacherMessage,
      messageFromStudent: studentMessage,
      messageFromStudentDate: todaysDate,
    });
    await queryClient.refetchQueries('myStudentCallbacks');
    toast.success(`Updated Callback Message for ${callback.student.name}`);
  };
  const getStudentMessageOptionsArray = (): MessageOption[] => {
    const options: MessageOption[] = studentMessageOptions.map((option) => ({
      key: option,
      value: option,
    }));
    if (!studentMessage) {
      options.unshift({
        key: 'default',
        value: 'No Current Message to Teacher',
      });
    } else {
      options.unshift({
        key: 'delete',
        value: studentDeleteMessage,
      });
    }
    if (studentMessage && !studentMessageOptions.includes(studentMessage)) {
      options.push({
        key: studentMessage,
        value: studentMessage,
        selected: true,
      });
    }
    return options;
  };
  const studentMessageOptionsArray = getStudentMessageOptionsArray();

  return (
    <Form
      className="border-0 bg-transparent shadow-none p-0 w-full"
      onSubmit={handleSubmit}
    >
      <FormGroup className="justify-center">
        <fieldset disabled={loading} aria-busy={loading} className="w-full">
          <div className="flex flex-col items-center gap-3 w-full text-center">
            {/* Student's message (visible to teachers / staff) */}
            {!isStudent && (
              <div className="w-full">
                <p className="text-xs uppercase tracking-wide text-[var(--textColor)] opacity-70">
                  Student
                </p>
                {callback?.messageFromStudent ? (
                  <>
                    <p className="text-white text-lg font-medium break-words px-2">
                      {callback.messageFromStudent}
                    </p>
                    {callback.messageFromStudentDate && (
                      <p className="text-xs opacity-60">
                        {callback.messageFromStudentDate}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="opacity-50 text-base">No message yet</p>
                )}
              </div>
            )}

            {/* Teacher's message (read-only for students / staff) */}
            {!isTeacher && (
              <div className="w-full">
                <p className="text-xs uppercase tracking-wide text-[var(--textColor)] opacity-70">
                  Teacher
                </p>
                {callback?.messageFromTeacher ? (
                  <>
                    <p className="text-white text-lg font-medium break-words px-2">
                      {callback.messageFromTeacher}
                    </p>
                    {callback.messageFromTeacherDate && (
                      <p className="text-xs opacity-60">
                        {callback.messageFromTeacherDate}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="opacity-50 text-base">No message yet</p>
                )}
              </div>
            )}

            {/* Teacher: remove the student's message */}
            {isTeacher && studentMessage && (
              <SmallGradientButton
                type="button"
                style={{ fontSize: '0.9rem', paddingBlock: '0.4rem' }}
                onClick={async () => {
                  const todaysDate = new Date().toLocaleDateString();
                  await updateCallback({
                    id: callback.id,
                    messageFromTeacher: teacherMessage,
                    messageFromStudent: '',
                    messageFromStudentDate: todaysDate,
                  });
                  queryClient.invalidateQueries(['myStudentCallbacks']);
                  queryClient.invalidateQueries(['allCallbacks']);
                  toast.success(
                    `Updated Callback Message for ${callback.student.name}`,
                  );
                }}
              >
                Delete Student Message
              </SmallGradientButton>
            )}

            {/* Student: choose a message to the teacher */}
            {isStudent && (
              <div className="w-full">
                <label
                  htmlFor={`student - ${callback.id}`}
                  className="block text-xs uppercase tracking-wide text-[var(--textColor)] opacity-70 mb-1"
                >
                  Your message to the teacher
                </label>
                <select
                  id={`student - ${callback.id}`}
                  value={studentMessage}
                  className={loading ? 'inputUpdating' : ''}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.92)',
                    color: '#1a1a1a',
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    textAlign: 'left',
                    textOverflow: 'ellipsis',
                  }}
                  onChange={handleSelectStudentMessage}
                >
                  {studentMessageOptionsArray.map((option) => (
                    <option
                      key={option.key}
                      value={option.value}
                      selected={option.selected}
                    >
                      {option.value}
                    </option>
                  ))}
                </select>
                {studentMessageDate && (
                  <p className="text-xs opacity-60 mt-1">{studentMessageDate}</p>
                )}
              </div>
            )}

            {/* Teacher: write a message back */}
            {isTeacher && (
              <div className="w-full">
                <label
                  htmlFor={`teacher-${callback.id}`}
                  className="block text-xs uppercase tracking-wide text-[var(--textColor)] opacity-70 mb-1"
                >
                  Teacher message
                </label>
                <textarea
                  id={`teacher-${callback.id}`}
                  placeholder="Message from Teacher"
                  value={teacherMessage}
                  className={loading ? 'inputUpdating' : ''}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.92)',
                    color: '#1a1a1a',
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                  }}
                  onKeyDown={submitOnEnter}
                  onChange={(e) => {
                    const todaysDate = new Date().toLocaleDateString();
                    setTeacherMessage(e.target.value);
                    setTeacherMessageDate(todaysDate);
                  }}
                  title="Enter to submit change, Shift-Enter for new line"
                />
                {teacherMessageDate && (
                  <p className="text-xs opacity-60 mt-1">{teacherMessageDate}</p>
                )}
              </div>
            )}
          </div>
        </fieldset>
      </FormGroup>
      <style jsx>{`
        .inputUpdating {
          animation: color-change 0.5s infinite;
        }
        @keyframes color-change {
          0% {
            color: var(--red);
          }
          50% {
            color: var(--blue);
            font-size: 16px;
          }
          100% {
            color: var(--red);
          }
        }
      `}</style>
    </Form>
  );
}
