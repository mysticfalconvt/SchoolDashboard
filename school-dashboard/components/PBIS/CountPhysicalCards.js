import { useMutation } from "@apollo/client";
import gql from "graphql-tag";
import { object } from "prop-types";
import { useState } from "react";
import useForm from "../../lib/useForm";
import DisplayError from "../ErrorMessage";
import GradientButton from "../styles/Button";
import Form, { FormContainerStyles } from "../styles/Form";
import { useUser } from "../User";

const CREATE_CARD_MUTATION = gql`
  mutation CREATE_CARD_MUTATION($cards: [PbisCardCreateInput!]!) {
    createPbisCards(data: $cards) {
      id
    }
  }
`;

// function to create array of cards based on value of id
function createCards(users, teacherId) {
  const userToAddCards = Object.keys(users);
  const cards = [];
  userToAddCards.forEach((user) => {
    if (users[user] > 0) {
      const numberOfCards = users[user];
      for (let i = 0; i < numberOfCards; i++) {
        cards.push({
          student: { connect: { id: user } },
          teacher: { connect: { id: teacherId } },
          category: "physical",
        });
      }
    }
  });
  return cards;
}
export default function CountPhysicalCards({ taStudents, refetch }) {
  const me = useUser();
  const [showForm, setShowForm] = useState(false);
  // creat an array of objects with keys taStudent.id and value of 0
  const taStudentCounts = {};
  taStudents.forEach((student) => {
    taStudentCounts[student.id] = 0;
  });
  // create an object with key of taStudent.id and value of 0

  //   const studentIds = taStudents.map((student) => student.id);
  const { inputs, handleChange, clearForm, resetForm } =
    useForm(taStudentCounts);
  const [countCardsMutation, { loading, error, data }] =
    useMutation(CREATE_CARD_MUTATION);

  return (
    <div>
      <GradientButton
        style={{ marginTop: "10px" }}
        onClick={() => setShowForm(!showForm)}
      >
        Log TA Cards
      </GradientButton>
      {showForm && (
        <>
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowForm(false)}
          />

          {/* Modal */}
          <div className="fixed z-50 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-2xl h-auto rounded-3xl bg-gradient-to-tr from-[var(--red)] to-[var(--blue)] overflow-hidden border-2 border-[var(--blue)] shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-[var(--blue)]">
              <h4 className="text-white text-xl font-semibold">
                Log TA Cards
              </h4>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="w-8 h-8 text-white bg-[var(--redTrans)] hover:bg-[var(--blue)] rounded-full flex items-center justify-center text-lg font-bold transition-colors duration-200"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <Form
                className="w-full bg-transparent border-0 shadow-none p-0"
                onSubmit={async (e) => {
                  e.preventDefault();
                  // Submit the inputfields to the backend:
                  //   const res = await countCardsMutation();
                  const cardsToCreate = await createCards(inputs, me.id);
                  const res = await countCardsMutation({
                    variables: { cards: cardsToCreate },
                  });
                  // get all the unique students from the cards
                  // get the unique student ids

                  refetch();
                  resetForm();
                  setShowForm(false);
                }}
              >
                <DisplayError error={error} />
                <fieldset disabled={loading} aria-busy={loading}>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {taStudents.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between gap-4"
                      >
                        <label htmlFor={student.id} className="text-white font-semibold flex-1">
                          {student.name}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="15"
                          id={student.id}
                          name={student.id}
                          placeholder="0"
                          value={inputs[student.id]}
                          onChange={handleChange}
                          onWheel={(e) => e.target.blur()}
                          className="w-24 p-2 rounded border bg-white text-gray-900 text-center"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-6">
                    <button
                      type="submit"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                      Update Data
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </fieldset>
              </Form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
