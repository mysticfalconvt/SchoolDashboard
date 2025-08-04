import useCreateMessage from '@/components/Messages/useCreateMessage';
import SearchForUserName from '@/components/SearchForUserName';
import GradientButton from '@/components/styles/Button';
import Form from '@/components/styles/Form';
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
  visible: boolean;
  hide: (show: boolean) => void;
}

function CardForm({ visible, hide }: CardFormProps) {
  const { inputs, handleChange, clearForm, resetForm } = useForm({
    message: '',
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
    <div className={`modal ${visible ? 'modal-open' : ''}`}>
      <div className="modal-backdrop" onClick={() => hide(false)}></div>
      <div 
        className="modal-box relative max-w-md w-full rounded-xl shadow-2xl p-6"
        style={{ background: 'linear-gradient(to top left, #760D08, #38B6FF)' }}
      >
        {hide && (
          <button
            type="button"
            onClick={() => hide(false)}
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 text-white hover:bg-white/20 border-none z-10"
            aria-label="Close"
          >
            ✕
          </button>
        )}
        <Form className="w-full bg-transparent border-0 shadow-none p-0">
          <label className="text-lg font-bold text-white mb-2">
            New PBIS Card
          </label>
          <SearchForUserName
            name="studentName"
            value={inputs.studentName}
            updateUser={setStudentCardIsFor}
            userType="isStudent"
          />
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text text-white font-semibold text-lg">Message</span>
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
          <div className="form-control w-full">
            <div className="flex flex-wrap gap-4 justify-center text-white font-semibold w-full mt-4">
              <label className="label cursor-pointer flex items-center gap-2 whitespace-nowrap">
                <input
                  type="radio"
                  name="category"
                  value="respect"
                  onChange={handleChange}
                  className="radio radio-sm"
                  style={{ 
                    accentColor: '#760D08',
                    borderColor: '#760D08'
                  }}
                />
                <span className="label-text text-white font-semibold">Respect</span>
              </label>
              <label className="label cursor-pointer flex items-center gap-2 whitespace-nowrap">
                <input
                  type="radio"
                  name="category"
                  value="responsibility"
                  onChange={handleChange}
                  className="radio radio-sm"
                  style={{ 
                    accentColor: '#760D08',
                    borderColor: '#760D08'
                  }}
                />
                <span className="label-text text-white font-semibold">Responsibility</span>
              </label>
              <label className="label cursor-pointer flex items-center gap-2 whitespace-nowrap">
                <input
                  type="radio"
                  name="category"
                  value="perseverance"
                  onChange={handleChange}
                  className="radio radio-sm"
                  style={{ 
                    accentColor: '#760D08',
                    borderColor: '#760D08'
                  }}
                />
                <span className="label-text text-white font-semibold">Perseverance</span>
              </label>
            </div>
          </div>
          <GradientButton
            type="submit"
            disabled={!studentCardIsFor || !inputs.category}
            className={`mt-4 w-full ${!studentCardIsFor || !inputs.category ? 'text-[var(--red)]' : ''}`}
            onClick={async (e) => {
              e.preventDefault();
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
              hide(false);
            }}
          >
            Give {studentCardIsFor && `${studentCardIsFor.userName} `}A PBIS
            Card
          </GradientButton>
        </Form>
      </div>
      <style jsx>{`
        .visible {
          opacity: 1;
          transition: all 0.6s ease-in-out;
          transform: scale(1);
        }
        .invisible {
          opacity: 0;
          pointer-events: none;
          transition: all 0.6s ease-in-out;
          transform: scale(0.9);
        }
      `}</style>
    </div>
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
          setDisplayCardForm(!displayCardForm);
        }}
      >
        PBIS CARD
      </GradientButton>
      {displayCardForm && (
        <CardForm visible={displayCardForm} hide={setDisplayCardForm} />
      )}
    </div>
  );
}
