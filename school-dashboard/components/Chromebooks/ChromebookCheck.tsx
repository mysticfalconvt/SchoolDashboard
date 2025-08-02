import useSendEmail from '@/components/../lib/useSendEmail';
import DisplayError from '@/components/ErrorMessage';
import GradientButton from '@/components/styles/Button';
import { FormDialog } from '@/components/styles/Dialog';
import Form from '@/components/styles/Form';
import { useUser } from '@/components/User';
import { useGqlMutation } from '@/lib/useGqlMutation';
import { useGQLQuery } from '@/lib/useGqlQuery';
import gql from 'graphql-tag';
import { useState } from 'react';
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
      }
    }
  }
`;

export const ChromeBookCheckMessageOptions = [
  '',
  'As Issued',
  'Same as previous week',
  'Missing Keys',
  'Broken Frame (Bezel)',
  'Broken Screen',
  'Broken Camera',
  'Other',
];
export const goodCheckMessages = ChromeBookCheckMessageOptions.slice(1, 3);
export const chromebookEmails = [
  'robert.boskind@ncsuvt.org',
  'Joyce.Lantagne@ncsuvt.org',
  'katlynn.cochran@ncsuvt.org',
];

interface Student {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface SingleChromebookCheckFormProps {
  student: Student;
  onComplete: () => void;
}

interface EmailData {
  toAddress: string;
  fromAddress: string;
  subject: string;
  body: string;
}

function SingleChromebookCheckForm({
  student,
  onComplete,
}: SingleChromebookCheckFormProps) {
  const me = useUser() as User;
  const [customMessage, setCustomMessage] = useState('');
  const [message, setMessage] = useState('');
  const [isDisabled, setIsDisabled] = useState(false);
  const queryClient = useQueryClient();
  const [createChromebookCheck, { loading, error }] = useGqlMutation(
    CREATE_CHROMEBOOK_CHECK_MUTATION,
  );
  const [createCard] = useGqlMutation(CREATE_QUICK_PBIS);
  const { sendEmail, emailLoading } = useSendEmail();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDisabled(true);

    try {
      await createChromebookCheck({
        chromebookCheck: {
          student: { connect: { id: student.id } },
          message:
            message === 'Other'
              ? customMessage
              : `${message} - ${customMessage}`,
        },
      });

      if (goodCheckMessages.includes(message) && student?.id) {
        await createCard({ teacher: me?.id, student: student?.id });
        await createCard({ teacher: me?.id, student: student?.id });
        await createCard({ teacher: me?.id, student: student?.id });
      }

      queryClient.refetchQueries();

      if (me?.id && !goodCheckMessages.includes(message)) {
        chromebookEmails.forEach(async (email) => {
          const emailToSend: EmailData = {
            toAddress: email,
            fromAddress: me.email,
            subject: `New Chromebook Check for ${student?.name}`,
            body: `
        <p>There is a new Chromebook check for ${student?.name} at NCUJHS.TECH created by ${me.name}. </p>
        <p>${message === 'Other' ? customMessage : `${message} - ${customMessage}`}</p>
         `,
          };
          await sendEmail({
            emailData: emailToSend,
          });
        });
      }

      onComplete();
    } catch (error) {
      console.log(error);
      setIsDisabled(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <DisplayError error={error as any} />
      <fieldset disabled={loading || isDisabled} aria-busy={loading}>
        <div className="mb-4">
          <h2 className="text-white font-bold text-xl mb-4">
            Chromebook Check for {student?.name}
          </h2>
        </div>

        <div className="mb-4">
          <label
            htmlFor="status"
            className="block text-white font-semibold mb-1"
          >
            Status
          </label>
          <select
            name="status"
            id="status"
            className="w-full p-2 rounded border appearance-none"
            onChange={(e) => {
              setMessage(e.target.value);
              if (e.target.value === 'As Issued') {
                setCustomMessage('');
              }
            }}
          >
            {ChromeBookCheckMessageOptions.map((option) => (
              <option key={`option-${option}`} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label
            htmlFor="message"
            className="block text-white font-semibold mb-1"
          >
            Message
          </label>
          <input
            type="text"
            name="message"
            id="message"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="w-full p-2 rounded border"
            placeholder="Enter additional details..."
          />
        </div>

        <button
          type="submit"
          disabled={
            loading ||
            isDisabled ||
            !message ||
            (message === 'Other' && !customMessage)
          }
          className="mt-6"
        >
          Submit Check
        </button>
      </fieldset>
    </Form>
  );
}

export default function ChromebookCheck() {
  const me = useUser() as User;
  const [showForm, setShowForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const { data: taTeacher } = useGQLQuery(
    `TAChromebookAssignments-${me?.id}`,
    GET_TA_CHROMEBOOK_ASSIGNMENTS_QUERY,
    { id: me?.id },
    { enabled: !!me?.id },
  );

  const students = taTeacher?.user?.taStudents || [];

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setShowForm(true);
  };

  const handleFormComplete = () => {
    setShowForm(false);
    setSelectedStudent(null);
  };

  return (
    <div>
      {students?.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-white font-semibold mb-2">
            TA Chromebook Checks
          </h3>
          {students.map((student) => (
            <GradientButton
              key={`chromebook-check-${student.id}`}
              onClick={() => handleStudentSelect(student)}
              style={{ marginBottom: '8px' }}
            >
              Chromebook Check: {student.name}
            </GradientButton>
          ))}
        </div>
      ) : null}

      <FormDialog
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setSelectedStudent(null);
        }}
        title="Chromebook Check"
        size="md"
      >
        {selectedStudent && (
          <SingleChromebookCheckForm
            student={selectedStudent}
            onComplete={handleFormComplete}
          />
        )}
      </FormDialog>
    </div>
  );
}
