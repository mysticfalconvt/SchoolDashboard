import { useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import React, { useState } from 'react';
import Toggle from 'react-toggle';
import 'react-toggle/style.css';
import useForm from '../../lib/useForm';
import useRevalidatePage from '../../lib/useRevalidatePage';
import DisplayError from '../ErrorMessage';
import GradientButton from '../styles/Button';
import Form, { FormContainer } from '../styles/Form';
import { useUser } from '../User';

interface NewLinkProps {
  refetchLinks?: () => void;
  hidden?: boolean;
}

interface FormInputs {
  name: string;
  link: string;
  description: string;
  forTeachers: boolean;
  forStudents: boolean;
  forParents: boolean;
  onHomePage: boolean;
  forPbis: boolean;
  forEPortfolio: boolean;
}

interface CreateLinkData {
  createLink: {
    id: string;
  };
}

interface CreateLinkVariables {
  name: string;
  description: string;
  forTeachers: boolean;
  forStudents: boolean;
  forParents: boolean;
  onHomePage: boolean;
  forPbis: boolean;
  forEPortfolio: boolean;
  link: string;
  modifiedBy: string;
}

const CREATE_LINK_MUTATION = gql`
  mutation CREATE_LINK_MUTATION(
    $name: String!
    $description: String!
    $forTeachers: Boolean!
    $forStudents: Boolean!
    $forParents: Boolean!
    $onHomePage: Boolean!
    $forPbis: Boolean!
    $forEPortfolio: Boolean!
    $link: String
    $modifiedBy: ID!
  ) {
    createLink(
      data: {
        name: $name
        description: $description
        forTeachers: $forTeachers
        forStudents: $forStudents
        forParents: $forParents
        onHomePage: $onHomePage
        link: $link
        forPbis: $forPbis
        forEPortfolio: $forEPortfolio
        modifiedBy: { connect: { id: $modifiedBy } }
      }
    ) {
      id
    }
  }
`;

const NewLink: React.FC<NewLinkProps> = ({ refetchLinks, hidden }) => {
  const revalidateIndexPage = useRevalidatePage('/');
  const revalidateLinkPage = useRevalidatePage('/links');
  const revalidateEPortfolioPage = useRevalidatePage('/ePortfolio');
  const [showForm, setShowForm] = useState(false);
  const { inputs, handleChange, clearForm, resetForm } = useForm({
    name: '',
    link: '',
    description: '',
    forTeachers: false,
    forStudents: false,
    forParents: false,
    onHomePage: false,
    forPbis: false,
    forEPortfolio: false,
  });
  const user = useUser();
  //   console.log(`user ${user.id}`);
  const [createLink, { loading, error, data }] = useMutation<
    CreateLinkData,
    CreateLinkVariables
  >(CREATE_LINK_MUTATION, {
    variables: {
      name: inputs.name,
      description: inputs.description,
      forTeachers: inputs.forTeachers,
      forStudents: inputs.forStudents,
      forParents: inputs.forParents,
      onHomePage: inputs.onHomePage,
      forPbis: inputs.forPbis,
      forEPortfolio: inputs.forEPortfolio,
      link: inputs.link,
      modifiedBy: user?.id || '',
    },
  });
  // console.log(inputs);
  if (hidden) return null;

  return (
    <div>
      <GradientButton
        onClick={() => setShowForm(!showForm)}
        style={{ marginLeft: '100px' }}
      >
        {showForm ? 'Close the form' : 'Add A New Link'}
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
          <Form className="w-full bg-transparent border-0 shadow-none p-0">
            <h1 className="text-white font-bold text-xl mb-4">
              Add a New Link
            </h1>
            <DisplayError error={error as any} />
            <fieldset disabled={loading} aria-busy={loading}>
              <div className="mb-4">
                <label
                  htmlFor="name"
                  className="block text-white font-semibold mb-1"
                >
                  Link Title
                </label>
                <input
                  required
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Link Title"
                  value={inputs.name}
                  onChange={handleChange}
                  className="w-full p-2 rounded border"
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="link"
                  className="block text-white font-semibold mb-1"
                >
                  Link
                </label>
                <input
                  type="text"
                  id="link"
                  name="link"
                  placeholder="Input Link Here"
                  value={inputs.link}
                  onChange={handleChange}
                  className="w-full p-2 rounded border"
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="description"
                  className="block text-white font-semibold mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Description"
                  required
                  value={inputs.description}
                  onChange={handleChange}
                  className="w-full p-2 rounded border"
                />
              </div>
              <div className="mt-4 mb-2 font-bold text-white">
                Visibility Options
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { id: 'forTeachers', label: 'Visible to Teachers' },
                  { id: 'forStudents', label: 'Visible to Students' },
                  { id: 'forParents', label: 'Visible to Parents' },
                  { id: 'onHomePage', label: 'Show on The HomePage' },
                  { id: 'forPbis', label: 'Show on The PBIS Page' },
                  {
                    id: 'forEPortfolio',
                    label: 'Show on The E-Portfolio Page',
                  },
                ].map(({ id, label }) => (
                  <label
                    key={id}
                    htmlFor={id}
                    className="flex items-center justify-between text-white font-medium"
                  >
                    <span>{label}</span>
                    <Toggle
                      id={id}
                      name={id}
                      checked={inputs[id as keyof FormInputs] as boolean}
                      onChange={handleChange}
                    />
                  </label>
                ))}
              </div>
              <button type="submit" className="mt-6">
                + Add A New Link
              </button>
            </fieldset>
          </Form>
        </div>
      </FormContainer>
    </div>
  );
};

export default NewLink;
