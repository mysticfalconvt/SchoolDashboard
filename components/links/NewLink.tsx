import useRevalidatePage from '@/components/../lib/useRevalidatePage';
import DisplayError from '@/components/ErrorMessage';
import GradientButton from '@/components/styles/Button';
import { FormDialog } from '@/components/styles/Dialog';
import Form from '@/components/styles/Form';
import { useUser } from '@/components/User';
import useForm from '@/lib/useForm';
import { useGqlMutation } from '@/lib/useGqlMutation';
import gql from 'graphql-tag';
import React, { useState } from 'react';
import Toggle from 'react-toggle';
import 'react-toggle/style.css';

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
  const revalidatePBISPage = useRevalidatePage('/pbis');
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
  const [createLink, { loading, error, data }] = useGqlMutation<
    CreateLinkData,
    CreateLinkVariables
  >(CREATE_LINK_MUTATION);
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
      <FormDialog
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Add a New Link"
        size="md"
      >
        <Form
          className="w-full border-0 shadow-none p-0"
          onSubmit={async (e) => {
            e.preventDefault();
            await createLink({
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
            });
            refetchLinks?.();
            resetForm();
            revalidateIndexPage();
            revalidateLinkPage();
            revalidateEPortfolioPage();
            revalidatePBISPage();
            setShowForm(false);
          }}
        >
          <DisplayError error={error as any} />
          <fieldset disabled={loading} aria-busy={loading}>
            <div className="form-control w-full mb-4">
              <label className="label" htmlFor="name">
                <span className="label-text text-white font-semibold">
                  Link Title
                </span>
              </label>
              <input
                required
                type="text"
                id="name"
                name="name"
                placeholder="Link Title"
                value={inputs.name}
                onChange={handleChange}
                className="input input-bordered w-full bg-base-100 text-base-content border-2 border-base-300 focus:border-[#760D08] focus:ring-2 focus:ring-[rgba(118,13,8,0.3)]"
              />
            </div>
            <div className="form-control w-full mb-4">
              <label className="label" htmlFor="link">
                <span className="label-text text-white font-semibold">
                  Link
                </span>
              </label>
              <input
                type="text"
                id="link"
                name="link"
                placeholder="Input Link Here"
                value={inputs.link}
                onChange={handleChange}
                className="input input-bordered w-full bg-base-100 text-base-content border-2 border-base-300 focus:border-[#760D08] focus:ring-2 focus:ring-[rgba(118,13,8,0.3)]"
              />
            </div>
            <div className="form-control w-full mb-4">
              <label className="label" htmlFor="description">
                <span className="label-text text-white font-semibold">
                  Description
                </span>
              </label>
              <textarea
                id="description"
                name="description"
                placeholder="Description"
                required
                value={inputs.description}
                onChange={handleChange}
                className="textarea textarea-bordered w-full bg-base-100 text-base-content border-2 border-base-300 focus:border-[#760D08] focus:ring-2 focus:ring-[rgba(118,13,8,0.3)] resize-none"
              />
            </div>
            <div className="divider">
              <span className="font-bold text-white text-lg">
                Visibility Options
              </span>
            </div>
            <div className="flex flex-col gap-3">
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
            <button
              type="submit"
              className="mt-6 w-full text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:brightness-110 transition-all duration-200 border-none"
              style={{
                background: 'linear-gradient(135deg, #760D08, #38B6FF)',
              }}
            >
              + Add A New Link
            </button>
          </fieldset>
        </Form>
      </FormDialog>
    </div>
  );
};

export default NewLink;
