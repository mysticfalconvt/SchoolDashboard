import useSendEmail from '@/components/../lib/useSendEmail';
import GradientButton from '@/components/styles/Button';
import { FormDialog } from '@/components/styles/Dialog';
import { useUser } from '@/components/User';
import { useGqlMutation } from '@/lib/useGqlMutation';
import { useGQLQuery } from '@/lib/useGqlQuery';
import gql from 'graphql-tag';
import { useState } from 'react';
import { useQueryClient } from 'react-query';
import toast from 'react-hot-toast';

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

interface StudentCheckData {
  [studentId: string]: {
    message: string;
    customMessage: string;
    isSubmitting: boolean;
  };
}

interface EmailData {
  toAddress: string;
  fromAddress: string;
  subject: string;
  body: string;
}

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
  const [createChromebookCheck] = useGqlMutation(CREATE_CHROMEBOOK_CHECK_MUTATION);
  const [createCard] = useGqlMutation(CREATE_QUICK_PBIS);
  const { sendEmail } = useSendEmail();

  const updateStudentData = (studentId: string, field: string, value: any) => {
    setStudentData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const handleStudentSubmit = async (student: Student) => {
    const data = studentData[student.id];
    if (!data?.message || (data.message === 'Other' && !data.customMessage)) {
      toast.error('Please fill in all required fields for ' + student.name);
      return;
    }

    updateStudentData(student.id, 'isSubmitting', true);

    try {
      await createChromebookCheck({
        chromebookCheck: {
          student: { connect: { id: student.id } },
          message: data.message === 'Other' ? data.customMessage : `${data.message} - ${data.customMessage}`,
        },
      });

      if (goodCheckMessages.includes(data.message) && student?.id) {
        await createCard({ teacher: me?.id, student: student?.id });
        await createCard({ teacher: me?.id, student: student?.id });
        await createCard({ teacher: me?.id, student: student?.id });
      }

      if (me?.id && !goodCheckMessages.includes(data.message)) {
        chromebookEmails.forEach(async (email) => {
          const emailToSend: EmailData = {
            toAddress: email,
            fromAddress: me.email,
            subject: `New Chromebook Check for ${student?.name}`,
            body: `
        <p>There is a new Chromebook check for ${student?.name} at NCUJHS.TECH created by ${me.name}. </p>
        <p>${data.message === 'Other' ? data.customMessage : `${data.message} - ${data.customMessage}`}</p>
         `,
          };
          await sendEmail({ emailData: emailToSend });
        });
      }

      toast.success(`Chromebook check submitted for ${student.name}`);
      queryClient.refetchQueries();
      
      // Clear the student's data after successful submission
      setStudentData(prev => {
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

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Chromebook Checks</h2>
        <p className="text-white/80">Submit chromebook checks for your TA students</p>
      </div>
      
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {students.map((student) => {
          const data = studentData[student.id] || { message: '', customMessage: '', isSubmitting: false };
          return (
            <div key={student.id} className="bg-base-200/20 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="lg:w-48 flex-shrink-0">
                  <h3 className="text-white font-semibold text-lg">{student.name}</h3>
                </div>
                
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-white font-medium">Status</span>
                    </label>
                    <select
                      className="select select-bordered select-sm bg-base-100 text-base-content border-2 border-base-300 focus:border-[#760D08]"
                      value={data.message}
                      onChange={(e) => {
                        updateStudentData(student.id, 'message', e.target.value);
                        if (e.target.value === 'As Issued') {
                          updateStudentData(student.id, 'customMessage', '');
                        }
                      }}
                    >
                      {ChromeBookCheckMessageOptions.map((option) => (
                        <option key={`${student.id}-${option}`} value={option}>
                          {option || 'Select status...'}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-white font-medium">Message</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered input-sm bg-base-100 text-base-content border-2 border-base-300 focus:border-[#760D08]"
                      placeholder="Enter additional details..."
                      value={data.customMessage}
                      onChange={(e) => updateStudentData(student.id, 'customMessage', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStudentSubmit(student)}
                    disabled={data.isSubmitting || !data.message || (data.message === 'Other' && !data.customMessage)}
                    className="btn btn-sm text-white font-medium border-none disabled:opacity-50"
                    style={{ background: data.isSubmitting ? '#666' : 'linear-gradient(135deg, #760D08, #38B6FF)' }}
                  >
                    {data.isSubmitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-end pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={onComplete}
          className="btn btn-outline text-white border-white/30 hover:bg-white/10"
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
        <GradientButton
          onClick={() => setShowForm(true)}
        >
          TA Chromebook Checks ({students.length} students)
        </GradientButton>
      ) : null}

      <FormDialog
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="TA Chromebook Checks"
        size="xl"
      >
        <MultiStudentCheckForm
          students={students}
          onComplete={handleFormComplete}
        />
      </FormDialog>
    </div>
  );
}
