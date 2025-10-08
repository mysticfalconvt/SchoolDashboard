import useSendEmail from '@/components/../lib/useSendEmail';
import GradientButton, {
  SmallGradientButton,
} from '@/components/styles/Button';
import { Dialog, DialogContent } from '@/components/styles/Dialog';
import { useUser } from '@/components/User';
import { CHROMEBOOK_CHECK_MIN_DAYS } from '@/config';
import {
  sendBulkChromebookEmails,
  sendChromebookCheckEmails,
  type Student as EmailStudent,
} from '@/lib/chromebookEmailUtils';
import { lastNameCommaFirstName } from '@/lib/lastNameCommaFirstName';
import { useGqlMutation } from '@/lib/useGqlMutation';
import { useGQLQuery } from '@/lib/useGqlQuery';
import gql from 'graphql-tag';
import { useEffect, useRef, useState } from 'react';
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
        chromebookCheck(orderBy: { time: desc }, take: 1) {
          id
          message
          time
        }
      }
    }
  }
`;

// Four-state model: everything good, something wrong, out for service, or not in cart
export const ChromeBookCheckMessageOptions = [
  'Everything good',
  'Something wrong',
  'Out for Service',
  'Not in Cart',
];
export const goodCheckMessages = ['Everything good'];
export const noEmailNoPBISMessages = ['Out for Service', 'Not in Cart'];
// Note: chromebookEmails and formatParentName are now imported from chromebookEmailUtils

interface User {
  id: string;
  name: string;
  email: string;
}

interface ChromebookCheck {
  id: string;
  message: string;
  time: string;
}

interface Student {
  id: string;
  name: string;
  email?: string;
  parent?: Array<{
    id: string;
    name: string;
    email?: string;
  }>;
  chromebookCheck?: ChromebookCheck[];
}

interface StudentCheckData {
  [studentId: string]: {
    message: string; // 'Everything good' | 'Something wrong' | 'Out for Service' | 'Not in Cart'
    customMessage: string; // required when message === 'Something wrong'
    isSubmitting: boolean;
  };
}

// Convert our Student type to EmailStudent type for email utils
const convertToEmailStudent = (student: Student): EmailStudent => ({
  id: student.id,
  name: student.name,
  email: student.email,
  parent: student.parent,
});

// Calculate time since last chromebook check
const getTimeSinceLastCheck = (student: Student): string => {
  if (!student.chromebookCheck || student.chromebookCheck.length === 0) {
    return 'never';
  }

  const lastCheckTime = new Date(student.chromebookCheck[0].time);
  const now = new Date();
  const diffMs = now.getTime() - lastCheckTime.getTime();

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(
    (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );

  if (diffDays === 0 && diffHours === 0) {
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return diffMinutes < 1 ? 'just now' : `${diffMinutes}M`;
  }

  if (diffDays === 0) {
    return `${diffHours}H`;
  }

  if (diffHours === 0) {
    return `${diffDays}D`;
  }

  return `${diffDays}D ${diffHours}H`;
};

// Check if student should be disabled (last check < CHROMEBOOK_CHECK_MIN_DAYS ago)
const isStudentDisabled = (student: Student): boolean => {
  if (!student.chromebookCheck || student.chromebookCheck.length === 0) {
    return false; // Never checked, so not disabled
  }

  const lastCheckTime = new Date(student.chromebookCheck[0].time);
  const now = new Date();
  const diffMs = now.getTime() - lastCheckTime.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays < CHROMEBOOK_CHECK_MIN_DAYS;
};

// Note: EmailData interface is now imported from chromebookEmailUtils

interface MultiStudentCheckFormProps {
  students: Student[];
  queryId: string;
  onComplete: () => void;
}

function MultiStudentCheckForm({
  students,
  queryId,
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
  const emailProgressRef = useRef<HTMLDivElement>(null);

  // Sort students by last name
  const sortedStudents = [...students].sort((a, b) => {
    const aFormatted = lastNameCommaFirstName(a.name);
    const bFormatted = lastNameCommaFirstName(b.name);
    return aFormatted.localeCompare(bFormatted);
  });

  // Auto-scroll to email progress when it becomes visible
  useEffect(() => {
    if (isSendingEmails && emailProgressRef.current) {
      emailProgressRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [isSendingEmails]);

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
    const data = studentData[student.id] ?? {
      message: 'Everything good',
      customMessage: '',
      isSubmitting: false,
    };

    if (data.message === 'Something wrong' && !data.customMessage) {
      toast.error('Please fill in all required fields for ' + student.name);
      return;
    }

    updateStudentData(student.id, 'isSubmitting', true);

    try {
      await createChromebookCheck({
        chromebookCheck: {
          student: { connect: { id: student.id } },
          // Persist the status message for predefined options, custom message for "Something wrong"
          message:
            data.message === 'Something wrong'
              ? data.customMessage
              : data.message,
        },
      });

      if (goodCheckMessages.includes(data.message) && student?.id) {
        await createCard({ teacher: me?.id, student: student?.id });
        await createCard({ teacher: me?.id, student: student?.id });
        await createCard({ teacher: me?.id, student: student?.id });
      }

      if (
        me?.id &&
        !goodCheckMessages.includes(data.message) &&
        !noEmailNoPBISMessages.includes(data.message)
      ) {
        setIsSendingEmails(true);
        setEmailProgress({ sent: 0, total: 0 });

        try {
          await sendChromebookCheckEmails({
            student: convertToEmailStudent(student),
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
      await queryClient.refetchQueries([`TAChromebookAssignments-${queryId}`]);

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
    let skippedCount = 0;

    // Collect all students that need emails sent
    const studentsNeedingEmails: Array<{
      student: Student;
      issueDetails: string;
    }> = [];

    for (const student of sortedStudents) {
      // Skip disabled students (recently checked)
      if (isStudentDisabled(student)) {
        skippedCount += 1;
        continue;
      }

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
          existing.message === 'Something wrong'
            ? existing.customMessage
            : existing.message;

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

        // Collect students that need emails (issues)
        if (
          me?.id &&
          existing.message !== 'Everything good' &&
          !noEmailNoPBISMessages.includes(existing.message)
        ) {
          studentsNeedingEmails.push({
            student: convertToEmailStudent(student),
            issueDetails: existing.customMessage,
          });
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

    // Now send all emails in bulk with proper progress tracking
    if (studentsNeedingEmails.length > 0) {
      setIsSendingEmails(true);

      try {
        await sendBulkChromebookEmails(
          studentsNeedingEmails,
          me.name,
          me.email,
          sendEmail,
          setEmailProgress,
        );
      } finally {
        setIsSendingEmails(false);
        setEmailProgress({ sent: 0, total: 0 });
        // Auto-close the form after emails are sent
        setTimeout(() => {
          onComplete();
        }, 1000);
      }
    }

    await queryClient.refetchQueries([`TAChromebookAssignments-${queryId}`]);
    if (successCount) {
      toast.success(`Submitted ${successCount} check(s)`);
    }
    if (failCount) {
      toast.error(`${failCount} check(s) failed or were invalid`);
    }
    if (skippedCount) {
      toast(`Skipped ${skippedCount} recently checked student(s)`, {
        icon: 'ℹ️',
      });
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
        {sortedStudents.map((student) => {
          const baseDefaults = {
            message: 'Everything good',
            customMessage: '',
            isSubmitting: false,
          };
          const data = { ...baseDefaults, ...(studentData[student.id] || {}) };
          const disabled = isStudentDisabled(student);

          return (
            <div
              key={student.id}
              className={`backdrop-blur-sm rounded-lg p-4 border transition-all ${
                disabled
                  ? 'bg-base-200/10 border-white/5 opacity-60'
                  : 'bg-base-200/20 border-white/10'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="lg:w-48 flex-shrink-0">
                  <h3 className="text-white font-semibold text-lg">
                    {lastNameCommaFirstName(student.name)}
                  </h3>
                  <p
                    className={`text-sm ${disabled ? 'text-white/40' : 'text-white/60'}`}
                  >
                    Last check: {getTimeSinceLastCheck(student)}
                    {disabled && (
                      <span className="block text-white/40 text-xs">
                        Recently checked
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-white font-medium">
                        Status
                      </span>
                    </label>
                    <select
                      className="select select-bordered select-sm bg-base-100 text-base-content border-2 border-base-300 focus:border-[#760D08] disabled:opacity-50"
                      value={data.message}
                      disabled={disabled}
                      onChange={(e) => {
                        if (disabled) return;
                        const newMessage = e.target.value;
                        updateStudentData(student.id, 'message', newMessage);
                        if (
                          newMessage === 'Everything good' ||
                          noEmailNoPBISMessages.includes(newMessage)
                        ) {
                          updateStudentData(student.id, 'customMessage', '');
                        }
                      }}
                    >
                      {ChromeBookCheckMessageOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-white font-medium">
                        Details
                      </span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered input-sm bg-base-100 text-base-content border-2 border-base-300 focus:border-[#760D08] disabled:opacity-50"
                      placeholder={
                        data.message === 'Everything good' ||
                        noEmailNoPBISMessages.includes(data.message)
                          ? 'No additional details needed'
                          : disabled
                            ? 'Recently checked'
                            : 'Describe the issue...'
                      }
                      value={data.customMessage}
                      disabled={
                        disabled ||
                        data.message === 'Everything good' ||
                        noEmailNoPBISMessages.includes(data.message)
                      }
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
                  <SmallGradientButton
                    type="button"
                    onClick={() => handleStudentSubmit(student)}
                    disabled={
                      disabled ||
                      data.isSubmitting ||
                      isSendingEmails ||
                      (data.message === 'Something wrong' &&
                        !data.customMessage)
                    }
                  >
                    {disabled
                      ? 'Recently Checked'
                      : data.isSubmitting
                        ? 'Submitting...'
                        : isSendingEmails
                          ? 'Sending Emails...'
                          : 'Submit'}
                  </SmallGradientButton>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isSendingEmails && (
        <div
          ref={emailProgressRef}
          className="mt-4 p-4 bg-blue-600 bg-opacity-20 rounded-lg"
        >
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
        <SmallGradientButton
          type="button"
          onClick={handleSubmitAll}
          disabled={
            isSubmittingAll ||
            isSendingEmails ||
            sortedStudents.every((student) => isStudentDisabled(student))
          }
        >
          {sortedStudents.every((student) => isStudentDisabled(student))
            ? 'All Recently Checked'
            : isSubmittingAll
              ? 'Submitting...'
              : isSendingEmails
                ? 'Sending Emails...'
                : 'Submit All'}
        </SmallGradientButton>
        <SmallGradientButton
          type="button"
          onClick={onComplete}
          disabled={isSendingEmails}
          className="opacity-70 hover:opacity-100"
        >
          Close
        </SmallGradientButton>
      </div>
    </div>
  );
}

interface ChromebookCheckProps {
  teacherId?: string;
}

export default function ChromebookCheck({
  teacherId,
}: ChromebookCheckProps = {}) {
  const me = useUser() as User;
  const [showForm, setShowForm] = useState(false);

  // Use teacherId if provided, otherwise use current user's id
  const queryId = teacherId || me?.id;
  const { data: taTeacher } = useGQLQuery(
    `TAChromebookAssignments-${queryId}`,
    GET_TA_CHROMEBOOK_ASSIGNMENTS_QUERY,
    { id: queryId },
    { enabled: !!queryId },
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
        className="max-w-7xl"
      >
        <DialogContent maxHeight="max-h-[50vh]" className="p-3">
          <MultiStudentCheckForm
            students={students}
            queryId={queryId}
            onComplete={handleFormComplete}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
