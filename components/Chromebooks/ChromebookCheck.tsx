import useSendEmail from '@/components/../lib/useSendEmail';
import GradientButton from '@/components/styles/Button';
import { Dialog, DialogContent } from '@/components/styles/Dialog';
import { useUser } from '@/components/User';
import {
  sendChromebookCheckEmails,
  type Student,
} from '@/lib/chromebookEmailUtils';
import { useGqlMutation } from '@/lib/useGqlMutation';
import { useGQLQuery } from '@/lib/useGqlQuery';
import gql from 'graphql-tag';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from 'react-query';

export const CREATE_CHROMEBOOK_CHECK_MUTATION = gql`
  mutation CREATE_CHROMEBOOK_CHECK_MUTATION(
    $chromebookCheck: ChromebookCheckCreateInput!
  ) {
    createChromebookCheck(data: $chromebookCheck) {
      id
      message
      student {
        id
        name
      }
    }
  }
`;

export const CREATE_QUICK_PBIS = gql`
  mutation CREATE_QUICK_PBIS($teacher: ID!, $student: ID!) {
    createPbisCard(
      data: {
        teacher: { connect: { id: $teacher } }
        student: { connect: { id: $student } }
        category: "Chromebook Check"
      }
    ) {
      id
      student {
        name
      }
      teacher {
        name
      }
    }
  }
`;

export const GET_TA_CHROMEBOOK_ASSIGNMENTS_QUERY = gql`
  query GET_TA_CHROMEBOOK_ASSIGNMENTS_QUERY($id: ID) {
    user(where: { id: $id }) {
      id
      name
      taStudents {
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
  }
`;

// Two-state model: either everything is good or there is an issue with a custom message
export const ChromeBookCheckMessageOptions = [
  'Everything good',
  'Something wrong',
];
export const goodCheckMessages = ['Everything good'];
// Note: chromebookEmails and formatParentName are now imported from chromebookEmailUtils

interface User {
  id: string;
  name: string;
  email: string;
}

interface StudentCheckData {
  [studentId: string]: {
    message: string; // 'Everything good' | 'Something wrong'
    customMessage: string; // required when message === 'Something wrong'
    isSubmitting: boolean;
  };
}

// Note: EmailData interface is now imported from chromebookEmailUtils

interface MultiStudentCheckFormProps {
  students: Student[];
  onComplete: () => void;
}

function MultiStudentCheckForm({
  students,
  onComplete,
}: MultiStudentCheckFormProps) {
  const me = useUser() as User;
  const queryClient = useQueryClient();
  const [studentData, setStudentData] = useState<StudentCheckData>({});
  const [isSubmittingAll, setIsSubmittingAll] = useState(false);
  const [emailProgress, setEmailProgress] = useState({ sent: 0, total: 0 });
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [createChromebookCheck] = useGqlMutation(
    CREATE_CHROMEBOOK_CHECK_MUTATION,
  );
  const [createCard] = useGqlMutation(CREATE_QUICK_PBIS);
  const { sendEmail } = useSendEmail();

  const updateStudentData = (
    studentId: string,
    field: 'message' | 'customMessage' | 'isSubmitting',
    value: any,
  ) => {
    setStudentData((prev) => {
      const existing = prev[studentId] ?? {
        message: 'Everything good',
        customMessage: '',
        isSubmitting: false,
      };
      const updated = {
        message: existing.message,
        customMessage: existing.customMessage,
        isSubmitting: existing.isSubmitting,
      } as { message: string; customMessage: string; isSubmitting: boolean };
      (updated as any)[field] = value;
      return { ...prev, [studentId]: updated };
    });
  };

  const handleStudentSubmit = async (student: Student) => {
    const data = studentData[student.id];
    if (
      !data?.message ||
      (data.message === 'Something wrong' && !data.customMessage)
    ) {
      toast.error('Please fill in all required fields for ' + student.name);
      return;
    }

    updateStudentData(student.id, 'isSubmitting', true);

    try {
      await createChromebookCheck({
        chromebookCheck: {
          student: { connect: { id: student.id } },
          // Persist 'Everything good' for green checks, otherwise only the custom message
          message:
            data.message === 'Everything good'
              ? 'Everything good'
              : data.customMessage,
        },
      });

      if (goodCheckMessages.includes(data.message) && student?.id) {
        await createCard({ teacher: me?.id, student: student?.id });
        await createCard({ teacher: me?.id, student: student?.id });
        await createCard({ teacher: me?.id, student: student?.id });
      }

      if (me?.id && !goodCheckMessages.includes(data.message)) {
        setIsSendingEmails(true);
        setEmailProgress({ sent: 0, total: 0 });

        try {
          await sendChromebookCheckEmails({
            student,
            teacherName: me.name,
            teacherEmail: me.email,
            issueDetails: data.customMessage,
            sendEmail,
            onProgress: setEmailProgress,
          });
        } finally {
          setIsSendingEmails(false);
          setEmailProgress({ sent: 0, total: 0 });
          // Auto-close the form after emails are sent
          setTimeout(() => {
            onComplete();
          }, 1000);
        }
      }

      toast.success(`Chromebook check submitted for ${student.name}`);
      queryClient.refetchQueries();

      // Clear the student's data after successful submission
      setStudentData((prev) => {
        const newData = { ...prev };
        delete newData[student.id];
        return newData;
      });
    } catch (error) {
      console.log(error);
      toast.error(`Failed to submit check for ${student.name}`);
    } finally {
      updateStudentData(student.id, 'isSubmitting', false);
    }
  };

  const handleSubmitAll = async () => {
    if (isSubmittingAll) return;
    setIsSubmittingAll(true);
    let successCount = 0;
    let failCount = 0;

    for (const student of students) {
      const existing = studentData[student.id] ?? {
        message: 'Everything good',
        customMessage: '',
        isSubmitting: false,
      };

      if (
        !existing.message ||
        (existing.message === 'Something wrong' && !existing.customMessage)
      ) {
        toast.error('Missing details for ' + student.name);
        failCount += 1;
        continue;
      }

      try {
        const messageToSend =
          existing.message === 'Everything good'
            ? 'Everything good'
            : existing.customMessage;

        await createChromebookCheck({
          chromebookCheck: {
            student: { connect: { id: student.id } },
            message: messageToSend,
          },
        });

        if (existing.message === 'Everything good' && student?.id) {
          await createCard({ teacher: me?.id, student: student?.id });
          await createCard({ teacher: me?.id, student: student?.id });
          await createCard({ teacher: me?.id, student: student?.id });
        }

        if (me?.id && existing.message !== 'Everything good') {
          setIsSendingEmails(true);
          setEmailProgress({ sent: 0, total: 0 });

          try {
            await sendChromebookCheckEmails({
              student,
              teacherName: me.name,
              teacherEmail: me.email,
              issueDetails: existing.customMessage,
              sendEmail,
              onProgress: setEmailProgress,
            });
          } finally {
            setIsSendingEmails(false);
            setEmailProgress({ sent: 0, total: 0 });
            // Auto-close the form after emails are sent
            setTimeout(() => {
              onComplete();
            }, 1000);
          }
        }

        successCount += 1;
        // Clear the student's data after successful submission
        setStudentData((prev) => {
          const newData = { ...prev } as StudentCheckData;
          delete newData[student.id];
          return newData;
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log(error);
        toast.error(`Failed to submit check for ${student.name}`);
        failCount += 1;
      }
    }

    await queryClient.refetchQueries();
    if (successCount) {
      toast.success(`Submitted ${successCount} check(s)`);
    }
    if (failCount) {
      toast.error(`${failCount} check(s) failed or were invalid`);
    }
    setIsSubmittingAll(false);
  };

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-white mb-1">Chromebook Checks</h2>
        <p className="text-white/80 text-sm">
          Submit chromebook checks for your TA students
        </p>
      </div>

      <div className="space-y-4">
        {students.map((student) => {
          const baseDefaults = {
            message: 'Everything good',
            customMessage: '',
            isSubmitting: false,
          };
          const data = { ...baseDefaults, ...(studentData[student.id] || {}) };
          return (
            <div
              key={student.id}
              className="bg-base-200/20 backdrop-blur-sm rounded-lg p-4 border border-white/10"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="lg:w-48 flex-shrink-0">
                  <h3 className="text-white font-semibold text-lg">
                    {student.name}
                  </h3>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-white font-medium">
                        Status
                      </span>
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={data.message === 'Everything good'}
                        onChange={(e) => {
                          const isGood = e.target.checked;
                          updateStudentData(
                            student.id,
                            'message',
                            isGood ? 'Everything good' : 'Something wrong',
                          );
                          if (isGood) {
                            updateStudentData(student.id, 'customMessage', '');
                          }
                        }}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      <span className="ml-3 text-sm font-medium text-white">
                        {data.message === 'Everything good'
                          ? 'Everything good'
                          : 'Something wrong'}
                      </span>
                    </label>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-white font-medium">
                        Details
                      </span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered input-sm bg-base-100 text-base-content border-2 border-base-300 focus:border-[#760D08]"
                      placeholder={
                        data.message === 'Everything good'
                          ? 'No issues to report'
                          : 'Describe the issue...'
                      }
                      value={data.customMessage}
                      disabled={data.message === 'Everything good'}
                      onChange={(e) =>
                        updateStudentData(
                          student.id,
                          'customMessage',
                          e.target.value,
                        )
                      }
                    />
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStudentSubmit(student)}
                    disabled={
                      data.isSubmitting ||
                      isSendingEmails ||
                      !data.message ||
                      (data.message === 'Something wrong' &&
                        !data.customMessage)
                    }
                    className="btn btn-sm text-white font-medium border-none disabled:opacity-50"
                    style={{
                      background:
                        data.isSubmitting || isSendingEmails
                          ? '#666'
                          : 'linear-gradient(135deg, #760D08, #38B6FF)',
                    }}
                  >
                    {data.isSubmitting
                      ? 'Submitting...'
                      : isSendingEmails
                        ? 'Sending Emails...'
                        : 'Submit'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
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
          onClick={handleSubmitAll}
          disabled={isSubmittingAll || isSendingEmails}
          className="btn btn-sm text-white font-medium border-none disabled:opacity-50"
          style={{
            background:
              isSubmittingAll || isSendingEmails
                ? '#666'
                : 'linear-gradient(135deg, #760D08, #38B6FF)',
          }}
        >
          {isSubmittingAll
            ? 'Submitting...'
            : isSendingEmails
              ? 'Sending Emails...'
              : 'Submit All'}
        </button>
        <button
          type="button"
          onClick={onComplete}
          disabled={isSendingEmails}
          className="btn btn-outline text-white border-white/30 hover:bg-white/10 disabled:opacity-50"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function ChromebookCheck() {
  const me = useUser() as User;
  const [showForm, setShowForm] = useState(false);
  const { data: taTeacher } = useGQLQuery(
    `TAChromebookAssignments-${me?.id}`,
    GET_TA_CHROMEBOOK_ASSIGNMENTS_QUERY,
    { id: me?.id },
    { enabled: !!me?.id },
  );

  const students = taTeacher?.user?.taStudents || [];

  const handleFormComplete = () => {
    setShowForm(false);
  };

  return (
    <div>
      {students?.length > 0 ? (
        <GradientButton onClick={() => setShowForm(true)}>
          TA Chromebook Checks ({students.length} students)
        </GradientButton>
      ) : null}

      <Dialog
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="TA Chromebook Checks"
        variant="modal"
        size="xl"
        maxHeight="60vh"
      >
        <DialogContent maxHeight="max-h-[50vh]" className="p-3">
          <MultiStudentCheckForm
            students={students}
            onComplete={handleFormComplete}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
