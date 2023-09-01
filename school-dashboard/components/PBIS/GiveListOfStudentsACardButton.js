import { useMutation } from "@apollo/client";
import gql from "graphql-tag";
import React from "react";
import { useQueryClient } from "react-query";
import { UPDATE_PBIS } from "../../lib/pbisUtils";
import GradientButton, { SmallGradientButton } from "../styles/Button";
import { useUser } from "../User";

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
function createCardsFromListOfStudents({ studentIds, teacher, message }) {
  const cardsToCreate = studentIds.map((studentId) => ({
    student: studentId,
    teacher: teacher.id,
    category: "class",
    message: message,
  }));
  return cardsToCreate;
}

const Form = ({
  handleCreateCards,
  message,
  setMessage,
  setDisplayForm,
  title,
  loading,
}) => {
  return (
    <div className="absolute top-0 left-0 right-0 bottom-0 flex flex-col  items-center ">
      <form
        onSubmit={handleCreateCards}
        // form is a small modal
        className="h-96 w-2/3 z-50 flex flex-col items-center justify-start  "
      >
        <fieldset
          disabled={loading}
          aria-busy={loading}
          className="flex flex-row gap-5 justify-center items-center z-50 bg-slate-500 mt-96  h-full w-full p-4 rounded-xl shadow-lg"
        >
          <label htmlFor="message" className="w-full flex gap-2">
            Message
            <input
              type="text"
              name="message"
              id="message"
              className="text-black w-full"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>

          <GradientButton type="button" onClick={() => handleCreateCards()}>
            Give a card to {title}
          </GradientButton>
          <GradientButton onClick={() => setDisplayForm(false)}>
            Cancel
          </GradientButton>
        </fieldset>
      </form>
    </div>
  );
};

export default function GiveListOfStudentsACardButton({ students, title }) {
  const me = useUser();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = React.useState(false);
  const [displayForm, setDisplayForm] = React.useState(false);
  const [message, setMessage] = React.useState(
    `${me.name} gave a card to the entire class`
  );
  const [createCard, { loading, error }] = useMutation(CREATE_CLASS_PBIS_CARD);

  const handleCreateCards = React.useCallback(async () => {
    console.log("handleCreateCards");
    const listOfStudentIds = students.map((student) => student.id);
    console.log("listOfStudentIds", listOfStudentIds);

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
      })
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
          students={students}
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
