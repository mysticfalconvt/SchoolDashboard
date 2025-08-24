import useSendEmail from '@/components/../lib/useSendEmail';
import SearchForUserName from '@/components/SearchForUserName';
import GradientButton from '@/components/styles/Button';
import { Dialog, DialogContent } from '@/components/styles/Dialog';
import { useUser } from '@/components/User';
import {
  sendChromebookCheckEmails,
  type StudentDetails,
} from '@/lib/chromebookEmailUtils';
import { useGqlMutation } from '@/lib/useGqlMutation';
import { useGQLQuery } from '@/lib/useGqlQuery';
import gql from 'graphql-tag';
import { useState } from 'react';
import {
  CREATE_CHROMEBOOK_CHECK_MUTATION,
  CREATE_QUICK_PBIS,
  goodCheckMessages,
} from './ChromebookCheck';

const GET_STUDENT_DETAILS_QUERY = gql`
  query GET_STUDENT_DETAILS_QUERY($id: ID!) {
    user(where: { id: $id }) {
      id
      name
      email
      parent {
        id
        name
        email
      }
    }
  }
`;

interface StudentUser {
  userId: string;
  userName: string;
}

interface User {
  id: string;
  name: string;
  email: string;
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
    'Something wrong',
  );
  const [emailProgress, setEmailProgress] = useState({ sent: 0, total: 0 });
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const { sendEmail, emailLoading } = useSendEmail();

  const [createCard] = useGqlMutation(CREATE_QUICK_PBIS);

  // Fetch student details when a student is selected
  const { data: studentDetails } = useGQLQuery(
    `studentDetails-${studentFor?.userId}`,
    GET_STUDENT_DETAILS_QUERY,
    { id: studentFor?.userId },
    { enabled: !!studentFor?.userId },
  );
  return (
    <div>
      <GradientButton onClick={() => setShowForm(true)}>
        Single Chromebook Check
      </GradientButton>

      <Dialog
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Single Chromebook Check"
        variant="modal"
        size="lg"
        maxHeight="80vh"
      >
        <DialogContent maxHeight="max-h-[70vh]" className="p-4">
          <div className="space-y-4">
            <div className="mb-2">
              <h2 className="text-lg font-bold text-white mb-1">Create Chromebook Check</h2>
              <p className="text-white/80 text-sm">
                Submit a single chromebook check for any student
              </p>
            </div>
            <div className="bg-base-200/20 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <div className="space-y-6">
                <div className="form-control">
                  <label className="label pb-2">
                    <span className="label-text text-white font-medium text-base">
                      Select Student
                    </span>
                  </label>
                  <SearchForUserName
                    name="studentName"
                    value=""
                    updateUser={setStudentCheckIsFor}
                    userType="isStudent"
                  />
                </div>

                <div className="form-control">
                  <div className="flex items-center justify-between py-2">
                    <span className="label-text text-white font-medium text-base">
                      Status
                    </span>
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
                      <span className="ml-4 text-base font-medium text-white">
                        {status === 'Everything good'
                          ? 'Everything good'
                          : 'Something wrong'}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="form-control">
                  <label className="label pb-2">
                    <span className="label-text text-white font-medium text-base">
                      Details
                    </span>
                  </label>
                  <input
                    id="message"
                    name="message"
                    type="text"
                    className="input input-bordered bg-base-100 text-base-content border-2 border-base-300 focus:border-[#760D08] disabled:opacity-50 h-12"
                    disabled={status === 'Everything good'}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      status === 'Everything good'
                        ? 'No issues to report'
                        : 'Describe the issue...'
                    }
                  />
                </div>
              </div>
            </div>

            {isSendingEmails && (
              <div className="mt-4 p-4 bg-blue-600 bg-opacity-20 rounded-lg">
                <div className="text-white text-center mb-2">
                  Sending emails... {emailProgress.sent} / {emailProgress.total}{' '}
                  emails sent
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width:
                        emailProgress.total > 0
                          ? `${(emailProgress.sent / emailProgress.total) * 100}%`
                          : '0%',
                    }}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
              <button
                type="button"
                disabled={
                  !studentFor?.userId ||
                  !status ||
                  (status === 'Something wrong' && !message) ||
                  isSendingEmails
                }
                className="btn btn-sm text-white font-medium border-none disabled:opacity-50"
                style={{
                  background:
                    isSendingEmails ||
                    !studentFor?.userId ||
                    (status === 'Something wrong' && !message)
                      ? '#666'
                      : 'linear-gradient(135deg, #760D08, #38B6FF)',
                }}
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
                const student = studentDetails?.user as StudentDetails;

                if (student) {
                  setIsSendingEmails(true);
                  setEmailProgress({ sent: 0, total: 0 });

                  try {
                    await sendChromebookCheckEmails({
                      student,
                      teacherName: me.name,
                      teacherEmail: me.email,
                      issueDetails: messageToSend,
                      sendEmail,
                      onProgress: setEmailProgress,
                    });
                  } finally {
                    setIsSendingEmails(false);
                    setEmailProgress({ sent: 0, total: 0 });
                    // Auto-close the form after emails are sent
                    setTimeout(() => {
                      setMessage('');
                      setShowForm(false);
                    }, 1000);
                  }
                } else {
                  setMessage('');
                  setShowForm(false);
                }
              } else {
                  setMessage('');
                  setShowForm(false);
                }
              }}
              >
                {isSendingEmails ? 'Sending Emails...' : 'Create Chromebook Check'}
              </button>
              
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={isSendingEmails}
                className="btn btn-outline text-white border-white/30 hover:bg-white/10 disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
