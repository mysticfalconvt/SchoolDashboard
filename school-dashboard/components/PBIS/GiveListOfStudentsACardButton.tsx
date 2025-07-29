import { useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import React from 'react';
import { useQueryClient } from 'react-query';
import { SmallGradientButton } from '../styles/Button';
import { useUser } from '../User';

const CREATE_CLASS_PBIS_CARD = gql`
  mutation CREATE_CLASS_PBIS_CARD(
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
    }
  }
`;

interface Student {
  id: string;
}

interface Teacher {
  id: string;
  name: string;
}

interface CardToCreate {
  student: string;
  teacher: string;
  category: string;
  message: string;
}

interface CreateCardsParams {
  studentIds: string[];
  teacher: Teacher;
  message: string;
}

function createCardsFromListOfStudents({
  studentIds,
  teacher,
  message,
}: CreateCardsParams): CardToCreate[] {
  const cardsToCreate = studentIds.map((studentId) => ({
    student: studentId,
    teacher: teacher.id,
    category: 'class',
    message: message,
  }));
  return cardsToCreate;
}

interface FormProps {
  handleCreateCards: () => void;
  message: string;
  setMessage: (message: string) => void;
  setDisplayForm: (show: boolean) => void;
  title: string;
  loading: boolean;
}

const Form = ({
  handleCreateCards,
  message,
  setMessage,
  setDisplayForm,
  title,
  loading,
}: FormProps) => {
  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={() => setDisplayForm(false)}
      />

      {/* Modal */}
      <div className="fixed z-50 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-md h-auto rounded-3xl bg-gradient-to-tr from-[var(--red)] to-[var(--blue)] overflow-hidden border-2 border-[var(--blue)] shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b border-[var(--blue)]">
          <h4 className="text-white text-xl font-semibold">
            Give PBIS Card to {title}
          </h4>
          <button
            type="button"
            onClick={() => setDisplayForm(false)}
            className="w-8 h-8 text-white bg-[var(--redTrans)] hover:bg-[var(--blue)] rounded-full flex items-center justify-center text-lg font-bold transition-colors duration-200"
          >
            ×
          </button>
        </div>
        <div className="p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateCards();
            }}
            className="w-full bg-transparent border-0 shadow-none p-0"
          >
            <fieldset disabled={loading} aria-busy={loading}>
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
                  className="w-full p-2 rounded border bg-white text-gray-900"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              <div className="flex gap-2 mt-6">
                <button type="submit" className="flex-1">
                  Give a card to {title}
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayForm(false)}
                  className="flex-1"
                >
                  Cancel
                </button>
              </div>
            </fieldset>
          </form>
        </div>
      </div>
    </>
  );
};

interface GiveListOfStudentsACardButtonProps {
  students: Student[];
  title: string;
}

export default function GiveListOfStudentsACardButton({
  students,
  title,
}: GiveListOfStudentsACardButtonProps) {
  const me = useUser() as Teacher;
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = React.useState(false);
  const [displayForm, setDisplayForm] = React.useState(false);
  const [message, setMessage] = React.useState(
    `${me.name} gave a card to the entire class`,
  );
  const [createCard, { loading, error }] = useMutation(CREATE_CLASS_PBIS_CARD);

  const handleCreateCards = React.useCallback(async () => {
    const listOfStudentIds = students.map((student) => student.id);

    setIsLoading(true);
    const cardsToCreate = await createCardsFromListOfStudents({
      studentIds: listOfStudentIds,
      teacher: me,
      message,
    });
    await Promise.all(
      cardsToCreate.map(async (card) => {
        //   console.log('card', card);
        const res = await createCard({ variables: card });
      }),
    );
    await queryClient.refetchQueries(`SingleTeacher-${me.id}`);
    setIsLoading(false);
    setDisplayForm(false);
    setMessage(`${me.name} gave a card to the entire class`);
  }, [students, me, message, queryClient, createCard]);
  return (
    <>
      <SmallGradientButton
        disabled={isLoading || students.length === 0}
        onClick={() => setDisplayForm(true)}
      >
        {title}
      </SmallGradientButton>
      {displayForm && (
        <Form
          handleCreateCards={handleCreateCards}
          message={message}
          setMessage={setMessage}
          setDisplayForm={setDisplayForm}
          title={title}
          loading={isLoading}
        />
      )}
    </>
  );
}
