import useSendEmail from '@/components/../lib/useSendEmail';
import SearchForUserName from '@/components/SearchForUserName';
import GradientButton, {
  SmallGradientButton,
} from '@/components/styles/Button';
import { useUser } from '@/components/User';
import { useGqlMutation } from '@/lib/useGqlMutation';
import { useState } from 'react';
import {
  CREATE_CHROMEBOOK_CHECK_MUTATION,
  CREATE_QUICK_PBIS,
  ChromeBookCheckMessageOptions,
  chromebookEmails,
  goodCheckMessages,
} from './ChromebookCheck';

interface StudentUser {
  userId: string;
  userName: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface EmailData {
  toAddress: string;
  fromAddress: string;
  subject: string;
  body: string;
}

export default function CreateSingleChromebookCheck() {
  const me = useUser() as User;
  const [createChromebookCheck, { data, loading, error }] = useGqlMutation(
    CREATE_CHROMEBOOK_CHECK_MUTATION,
  );
  const [message, setMessage] = useState('');
  const [studentFor, setStudentCheckIsFor] = useState<StudentUser | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState('idle');
  const { sendEmail, emailLoading } = useSendEmail();

  const [createCard] = useGqlMutation(CREATE_QUICK_PBIS);
  return (
    <>
      <GradientButton onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancel CB Check' : 'Chromebook Check'}
      </GradientButton>
      {showForm && (
        <div className="absolute top-1/3  w-3/4 p-4 flex text-white flex-col rounded-xl gap-2 items-center bg-slate-600 z-50 ">
          <SmallGradientButton
            className="self-end m-2"
            onClick={() => setShowForm(!showForm)}
          >
            Cancel
          </SmallGradientButton>
          <h2 className="text-center text-2xl">Create Chromebook Check</h2>
          <div className="flex flex-col gap-2 w-3/4 items-stretch m-auto">
            <label htmlFor="assignmentId">Chromebook</label>
            <SearchForUserName
              name="studentName"
              value=""
              updateUser={setStudentCheckIsFor}
              userType="isStudent"
            />
            <label htmlFor="status" key={`status-chromebook-single`}>
              Status:{' '}
              <select
                name="status"
                id="status"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                onChange={(e) => {
                  setStatus(e.target.value);
                  // if (e.target.value !== "Other") {
                  //   setMessage("");
                  // }
                }}
              >
                {ChromeBookCheckMessageOptions.map((option) => (
                  <option key={`option-${option}`} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="message">Message</label>
            <input
              id="message"
              name="message"
              // disabled={status !== "Other"}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="border-2 border-gray-400 rounded-md text-gray-800"
            />
          </div>
          <GradientButton
            disabled={
              !studentFor?.userId || !status || (status === 'Other' && !message)
            }
            onClick={async () => {
              // message gets status if status is not other.  Otherwise, message is message
              // if the teacher is the teacher of the assignment, then the message is just the message
              // if the teacher is not the teacher of the assignment, then the message is the message + teacher name

              let messageToSend = message;
              if (status !== 'Other') {
                messageToSend = `${status} - ${message} - ${me.name}`;
              }

              await createChromebookCheck({
                chromebookCheck: {
                  student: { connect: { id: studentFor?.userId } },
                  message: messageToSend,
                },
              });

              // check if messageToSend starts with something in goodCheckMessages
              const isGoodCheck = goodCheckMessages.some((goodMessage) =>
                messageToSend.startsWith(goodMessage),
              );
              if (goodCheckMessages.includes(messageToSend) && isGoodCheck) {
                await createCard({
                  teacher: me?.id,
                  student: studentFor?.userId,
                });
                await createCard({
                  teacher: me?.id,
                  student: studentFor?.userId,
                });
                await createCard({
                  teacher: me?.id,
                  student: studentFor?.userId,
                });
              }

              if (me?.id && !isGoodCheck) {
                chromebookEmails.forEach(async (email) => {
                  const emailToSend: EmailData = {
                    toAddress: email,
                    fromAddress: me?.email,
                    subject: `New Chromebook Check for ${studentFor?.userName}`,
                    body: `
                <p>There is a new Chromebook check for ${studentFor?.userName} at NCUJHS.TECH created by ${me.name}. </p>
                <p>${messageToSend}</p>
                 `,
                  };
                  await sendEmail({
                    variables: {
                      emailData: emailToSend,
                    },
                  });
                });
              }
              setMessage('');
              setShowForm(false);
            }}
          >
            Create Chromebook Check
          </GradientButton>
        </div>
      )}
    </>
  );
}
