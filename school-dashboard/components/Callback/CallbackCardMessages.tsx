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
      //   className={showForm ? 'visible' : 'hidden'}
      // hidden={!showForm}
      onSubmit={handleSubmit}
    >
      <FormGroup>
        <fieldset disabled={loading} aria-busy={loading}>
          {!isStudent && (
            <p className="relative border-none p-0 m-0 text-[14px] text-[var(--textColor)] text-center transition-all duration-300">
              Student:
              <span
                className={
                  callback?.messageFromStudent
                    ? 'text-white text-[1.6rem] p-2 break-words hasText'
                    : ''
                }
              >
                {callback.messageFromStudent || '----'}
              </span>
              <span>{callback.messageFromStudentDate || ''}</span>
            </p>
          )}
          {!isTeacher && (
            <p className="relative border-none p-0 m-0 text-[14px] text-[var(--textColor)] text-center transition-all duration-300">
              Teacher:
              <span
                className={
                  callback?.messageFromTeacher
                    ? 'text-white text-[1.6rem] p-2 break-words hasText'
                    : ''
                }
              >
                {callback.messageFromTeacher || '----'}
              </span>
              <span>{callback.messageFromTeacherDate || '----'}</span>
            </p>
          )}
          {isStudent && (
            <p className="relative border-none p-0 m-0 text-[14px] text-[var(--textColor)] text-center transition-all duration-300">
              Student Message:
              <select
                id={`student - ${callback.id}`}
                value={studentMessage}
                className={loading ? 'inputUpdating' : ''}
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
              <span>{studentMessageDate || '-'}</span>
            </p>
          )}

          {isTeacher && (
            <>
              {studentMessage && (
                <SmallGradientButton
                  type="button"
                  style={{
                    fontSize: '1rem',
                    paddingBlock: '0.5rem',
                    textAlign: 'center',
                  }}
                  onClick={async () => {
                    const todaysDate = new Date().toLocaleDateString();
                    await updateCallback({
                      id: callback.id,
                      messageFromTeacher: teacherMessage,
                      messageFromStudent: '',
                      messageFromStudentDate: todaysDate,
                    });
                    await queryClient.refetchQueries({});
                    toast.success(
                      `Updated Callback Message for ${callback.student.name}`,
                    );
                  }}
                >
                  Delete Student Message
                </SmallGradientButton>
              )}
              <p className="relative border-none p-0 m-0 text-[14px] text-[var(--textColor)] text-center transition-all duration-300">
                Teacher:
                <textarea
                  id={`teacher-${callback.id}`}
                  placeholder="Message from Teacher"
                  value={teacherMessage}
                  className={loading ? 'inputUpdating' : ''}
                  onKeyDown={submitOnEnter}
                  onChange={(e) => {
                    //   console.log(e.target.value);
                    const todaysDate = new Date().toLocaleDateString();
                    setTeacherMessage(e.target.value);
                    setTeacherMessageDate(todaysDate);
                  }}
                  title="Enter to submit change, Shift-Enter for new line"
                />
                <span>{teacherMessageDate || '-'}</span>
              </p>
            </>
          )}
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
