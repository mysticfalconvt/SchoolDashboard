import useCreateMessage from '@/components/Messages/useCreateMessage';
import SearchForUserName from '@/components/SearchForUserName';
import GradientButton from '@/components/styles/Button';
import { Dialog, DialogContent } from '@/components/styles/Dialog';
import { useUser } from '@/components/User';
import useForm from '@/lib/useForm';
import { useGqlMutation } from '@/lib/useGqlMutation';
import gql from 'graphql-tag';
import { useState } from 'react';

const CREATE_PBIS_CARD = gql`
  mutation CREATE_QUICK_PBIS(
    $teacher: ID!
    $student: ID!
    $category: String
    $message: String
  ) {
    createPbisCard(
      data: {
        teacher: { connect: { id: $teacher } }
        student: { connect: { id: $student } }
        category: $category
        cardMessage: $message
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

interface FormInputs {
  message: string;
  category?: string;
  studentName?: string;
}

interface User {
  id: string;
  name: string;
}

interface StudentUser {
  userId: string;
  userName: string;
}

interface CardFormProps {
  isOpen: boolean;
  onClose: () => void;
}

function CardForm({ isOpen, onClose }: CardFormProps) {
  const { inputs, handleChange, resetForm } = useForm({
    message: '',
    category: '',
  });
  const me = useUser() as User;
  const teacher = me?.id;
  const [studentCardIsFor, setStudentCardIsFor] = useState<
    StudentUser | undefined
  >();
  const [createCard, { loading, error, data }] =
    useGqlMutation(CREATE_PBIS_CARD);
  const createMessage = useCreateMessage();

  if (error) {
    console.log(error);
    return <p>{error.message}</p>;
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="New PBIS Card"
      variant="modal"
      size="md"
      maxHeight="80vh"
    >
      <DialogContent maxHeight="max-h-[70vh]" className="p-4">
        <div className="space-y-4">
          <div className="mb-2">
            <p className="text-white/80 text-sm">
              Create a PBIS card for a student
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
                  value={inputs.studentName}
                  updateUser={setStudentCardIsFor}
                  userType="isStudent"
                />
              </div>

              <div className="form-control">
                <label className="label pb-2">
                  <span className="label-text text-white font-medium text-base">
                    Message
                  </span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="Student Message"
                  value={inputs.message}
                  onChange={handleChange}
                  className="textarea textarea-bordered w-full bg-base-100 text-base-content border-2 border-base-300 focus:border-[#760D08] focus:ring-2 focus:ring-[rgba(118,13,8,0.3)] resize-none min-h-[5rem]"
                />
              </div>

              <div className="form-control">
                <label className="label pb-2">
                  <span className="label-text text-white font-medium text-base">
                    Category
                  </span>
                </label>
                <div className="flex flex-wrap gap-4 justify-center text-white font-semibold w-full">
                  <label className="label cursor-pointer flex items-center gap-2 whitespace-nowrap">
                    <input
                      type="radio"
                      name="category"
                      value="respect"
                      checked={inputs.category === 'respect'}
                      onChange={handleChange}
                      className="radio radio-sm"
                      style={{
                        accentColor: '#760D08',
                        borderColor: '#760D08',
                      }}
                    />
                    <span className="label-text text-white font-semibold">
                      Respect
                    </span>
                  </label>
                  <label className="label cursor-pointer flex items-center gap-2 whitespace-nowrap">
                    <input
                      type="radio"
                      name="category"
                      value="responsibility"
                      checked={inputs.category === 'responsibility'}
                      onChange={handleChange}
                      className="radio radio-sm"
                      style={{
                        accentColor: '#760D08',
                        borderColor: '#760D08',
                      }}
                    />
                    <span className="label-text text-white font-semibold">
                      Responsibility
                    </span>
                  </label>
                  <label className="label cursor-pointer flex items-center gap-2 whitespace-nowrap">
                    <input
                      type="radio"
                      name="category"
                      value="perseverance"
                      checked={inputs.category === 'perseverance'}
                      onChange={handleChange}
                      className="radio radio-sm"
                      style={{
                        accentColor: '#760D08',
                        borderColor: '#760D08',
                      }}
                    />
                    <span className="label-text text-white font-semibold">
                      Perseverance
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
            <button
              type="button"
              disabled={!studentCardIsFor || !inputs.category}
              className="btn btn-sm text-white font-medium border-none disabled:opacity-50"
              style={{
                background:
                  !studentCardIsFor || !inputs.category
                    ? '#666'
                    : 'linear-gradient(135deg, #760D08, #38B6FF)',
              }}
              onClick={async () => {
                await createCard({
                  teacher,
                  student: studentCardIsFor?.userId,
                  message: inputs.message,
                  category: inputs.category,
                });
                await createMessage({
                  subject: 'New PBIS Card',
                  message: inputs.message,
                  receiver: studentCardIsFor?.userId || '',
                  link: '',
                });
                // Don't reset form data - only clear student selection
                setStudentCardIsFor(undefined);
                // Clear the student name input field by updating the form inputs directly
                handleChange({
                  target: { name: 'studentName', value: '' },
                } as React.ChangeEvent<HTMLInputElement>);
                // Close the form after successful submission
                onClose();
              }}
            >
              Give {studentCardIsFor && `${studentCardIsFor.userName} `}A PBIS
              Card
            </button>

            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline text-white border-white/30 hover:bg-white/10"
            >
              Close
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface PbisCardFormButtonProps {
  teacher: User;
}

export default function PbisCardFormButton({
  teacher,
}: PbisCardFormButtonProps) {
  const [displayCardForm, setDisplayCardForm] = useState(false);
  return (
    <div className="p-5 flex transition-all duration-1000">
      <GradientButton
        onClick={() => {
          setDisplayCardForm(true);
        }}
      >
        PBIS CARD
      </GradientButton>
      <CardForm
        isOpen={displayCardForm}
        onClose={() => setDisplayCardForm(false)}
      />
    </div>
  );
}
