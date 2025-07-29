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
    <div
      className={`fixed inset-0 z-[1000] flex items-center justify-center ${visible ? '' : 'pointer-events-none'}`}
    >
      <div className="bg-gradient-to-tl from-[var(--red)] to-[var(--blue)] border-[5px] border-[var(--tableAccentColor)] rounded-xl shadow-2xl p-6 relative w-full max-w-md">
        {hide && (
          <button
            type="button"
            onClick={() => hide(false)}
            className="absolute top-2 right-2 text-white text-2xl font-bold bg-black bg-opacity-40 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70 focus:outline-none"
            aria-label="Close"
          >
            ×
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
          <label
            htmlFor="message"
            className="flex flex-col gap-1 text-white font-semibold"
          >
            <span>Message</span>
            <textarea
              id="message"
              name="message"
              placeholder="Student Message"
              value={inputs.message}
              onChange={handleChange}
              className="rounded p-2 text-black resize-none min-h-[3rem]"
            />
          </label>
          <div className="flex flex-wrap gap-4 justify-between text-white font-semibold w-full">
            <label
              htmlFor="respect"
              className="flex items-center gap-1 whitespace-nowrap"
            >
              <input
                type="radio"
                name="category"
                id="respect"
                value="respect"
                onChange={handleChange}
              />
              Respect
            </label>
            <label
              htmlFor="responsibility"
              className="flex items-center gap-1 whitespace-nowrap"
            >
              <input
                type="radio"
                name="category"
                id="responsibility"
                value="responsibility"
                onChange={handleChange}
              />
              Responsibility
            </label>
            <label
              htmlFor="perseverance"
              className="flex items-center gap-1 whitespace-nowrap"
            >
              <input
                type="radio"
                name="category"
                id="perseverance"
                value="perseverance"
                onChange={handleChange}
              />
              Perseverance
            </label>
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
