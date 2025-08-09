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
  const [status, setStatus] = useState<'Everything good' | 'Something wrong'>(
    'Everything good',
  );
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
              Status
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={status === 'Everything good'}
                onChange={(e) => {
                  const isGood = e.target.checked;
                  setStatus(isGood ? 'Everything good' : 'Something wrong');
                  if (isGood) setMessage('');
                }}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-medium text-white">
                {status === 'Everything good'
                  ? 'Everything good'
                  : 'Something wrong'}
              </span>
            </label>
            <label htmlFor="message">Details</label>
            <input
              id="message"
              name="message"
              disabled={status === 'Everything good'}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="border-2 border-gray-400 rounded-md text-gray-800"
              placeholder={
                status === 'Everything good'
                  ? 'No issues to report'
                  : 'Describe the issue...'
              }
            />
          </div>
          <GradientButton
            disabled={
              !studentFor?.userId ||
              !status ||
              (status === 'Something wrong' && !message)
            }
            onClick={async () => {
              // Persist 'Everything good' for green checks, otherwise only the custom message
              const messageToSend =
                status === 'Everything good' ? 'Everything good' : message;

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
              if (isGoodCheck) {
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
                    emailData: emailToSend,
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
