import useForm from '@/lib/useForm';
import { useGqlMutation } from '@/lib/useGqlMutation';
import gql from 'graphql-tag';
import { useRouter } from 'next/dist/client/router';
import React, { useState } from 'react';
import { useQueryClient } from 'react-query';

import DisplayError from './ErrorMessage';
import { useUser } from './User';
import GradientButton from './styles/Button';
import Form, { FormContainer } from './styles/Form';

const CREATE_SORTING_QUESTION = gql`
  mutation CREATE_SORTING_QUESTION(
    $question: String!
    $gryffindorChoice: String!
    $hufflepuffChoice: String!
    $ravenclawChoice: String!
    $slytherinChoice: String!
    $createdBy: ID!
  ) {
    createSortingHatQuestion(
      data: {
        question: $question
        gryffindorChoice: $gryffindorChoice
        hufflepuffChoice: $hufflepuffChoice
        ravenclawChoice: $ravenclawChoice
        slytherinChoice: $slytherinChoice
        createdBy: { connect: { id: $createdBy } }
      }
    ) {
      id
    }
  }
`;

interface SortingHatInputs {
  question: string;
  gryffindorChoice: string;
  ravenclawChoice: string;
  hufflepuffChoice: string;
  slytherinChoice: string;
}

const NewSortingHatQuestion: React.FC = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const { inputs, handleChange, clearForm, resetForm } = useForm({
    question: '',
    gryffindorChoice: '',
    ravenclawChoice: '',
    hufflepuffChoice: '',
    slytherinChoice: '',
  });
  const me = useUser();

  const [createSortingHatQuestion, { data, loading, error }] = useGqlMutation(
    CREATE_SORTING_QUESTION,
  );
  // TODO: send message when callback assigned

  return (
    <div>
      <GradientButton
        onClick={() => setShowForm(!showForm)}
        style={{ marginLeft: '100px' }}
      >
        {showForm ? 'Close the form' : 'New Sorting Hat Question'}
      </GradientButton>
      <FormContainer visible={showForm}>
        <div className="bg-gradient-to-tl from-[var(--red)] to-[var(--blue)] border-[5px] border-[var(--tableAccentColor)] rounded-xl shadow-2xl p-6 relative w-full max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="absolute top-2 right-2 text-white text-2xl font-bold bg-black bg-opacity-40 rounded-full w-10 h-8 flex items-center justify-center hover:bg-opacity-70 focus:outline-none"
            aria-label="Close"
          >
            ×
          </button>
          <Form
            className="w-full bg-transparent border-0 shadow-none p-0"
            onSubmit={async (e) => {
              e.preventDefault();
              const res = await createSortingHatQuestion({
                question: inputs.question,
                gryffindorChoice: inputs.gryffindorChoice,
                ravenclawChoice: inputs.ravenclawChoice,
                hufflepuffChoice: inputs.hufflepuffChoice,
                slytherinChoice: inputs.slytherinChoice,
                createdBy: me.id,
              });
              queryClient.refetchQueries('SortingHatQuestions');
              clearForm();
              setShowForm(false);
            }}
          >
            <h2 className="text-white font-bold text-xl mb-4">
              Add a New Sorting Hat Question
            </h2>
            <DisplayError error={error as any} />
            <fieldset disabled={loading} aria-busy={loading}>
              <div className="mb-4">
                <label
                  htmlFor="question"
                  className="block text-white font-semibold mb-1"
                >
                  Question
                </label>
                <textarea
                  id="question"
                  name="question"
                  placeholder="question"
                  required
                  value={inputs.question}
                  onChange={handleChange}
                  rows={5}
                  className="w-full p-2 rounded border"
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="gryffindorChoice"
                  className="block text-white font-semibold mb-1"
                >
                  Gryffindor Choice
                </label>
                <textarea
                  id="gryffindorChoice"
                  name="gryffindorChoice"
                  placeholder="gryffindorChoice"
                  required
                  value={inputs.gryffindorChoice}
                  onChange={handleChange}
                  rows={2}
                  className="w-full p-2 rounded border"
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="ravenclawChoice"
                  className="block text-white font-semibold mb-1"
                >
                  Ravenclaw Choice
                </label>
                <textarea
                  id="ravenclawChoice"
                  name="ravenclawChoice"
                  placeholder="ravenclawChoice"
                  required
                  value={inputs.ravenclawChoice}
                  onChange={handleChange}
                  rows={2}
                  className="w-full p-2 rounded border"
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="hufflepuffChoice"
                  className="block text-white font-semibold mb-1"
                >
                  Hufflepuff Choice
                </label>
                <textarea
                  id="hufflepuffChoice"
                  name="hufflepuffChoice"
                  placeholder="hufflepuffChoice"
                  required
                  value={inputs.hufflepuffChoice}
                  onChange={handleChange}
                  rows={2}
                  className="w-full p-2 rounded border"
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="slytherinChoice"
                  className="block text-white font-semibold mb-1"
                >
                  Slytherin Choice
                </label>
                <textarea
                  id="slytherinChoice"
                  name="slytherinChoice"
                  placeholder="slytherinChoice"
                  required
                  value={inputs.slytherinChoice}
                  onChange={handleChange}
                  rows={2}
                  className="w-full p-2 rounded border"
                />
              </div>
              <button type="submit" className="mt-6">
                + Publish
              </button>
            </fieldset>
          </Form>
        </div>
      </FormContainer>
    </div>
  );
};

export default NewSortingHatQuestion;
