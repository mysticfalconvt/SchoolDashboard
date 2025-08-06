import useRevalidatePage from '@/components/../lib/useRevalidatePage';
import DisplayError from '@/components/ErrorMessage';
import { SmallGradientButton } from '@/components/styles/Button';
import { FormDialog } from '@/components/styles/Dialog';
import Form from '@/components/styles/Form';
import { useUser } from '@/components/User';
import useForm from '@/lib/useForm';
import { useGqlMutation } from '@/lib/useGqlMutation';
import gql from 'graphql-tag';
import React, { useMemo, useState } from 'react';
import { useQueryClient } from 'react-query';
import Toggle from 'react-toggle';
import 'react-toggle/style.css';

interface Link {
  id: string;
  name: string;
  description?: string;
  link?: string;
  forTeachers?: boolean;
  forStudents?: boolean;
  forParents?: boolean;
  onHomePage?: boolean;
  forPbis?: boolean;
  forEPortfolio?: boolean;
}

interface EditLinkProps {
  link: Link;
  refetch?: () => void;
  setVisibleForm: (id: string | null) => void;
  visibleForm: string | null;
}

interface FormInputs {
  name: string;
  description: string;
  link: string;
  forTeachers: boolean;
  forStudents: boolean;
  forParents: boolean;
  onHomePage: boolean;
  forPbis: boolean;
  forEPortfolio: boolean;
}

interface UpdateLinkData {
  updateLink: {
    id: string;
  };
}

interface UpdateLinkVariables {
  id: string;
  name: string;
  description: string;
  link: string;
  forTeachers: boolean;
  forStudents: boolean;
  forParents: boolean;
  onHomePage: boolean;
  forPbis: boolean;
  forEPortfolio: boolean;
}

interface DeleteLinkData {
  deleteLink: {
    id: string;
  };
}

interface DeleteLinkVariables {
  id: string;
}

const UPDATE_LINK_MUTATION = gql`
  mutation UPDATE_LINK_MUTATION(
    $id: ID!
    $name: String!
    $description: String
    $link: String
    $forTeachers: Boolean!
    $forStudents: Boolean!
    $forParents: Boolean!
    $onHomePage: Boolean!
    $forPbis: Boolean!
    $forEPortfolio: Boolean!
  ) {
    updateLink(
      where: { id: $id }
      data: {
        name: $name
        description: $description
        link: $link
        forTeachers: $forTeachers
        forStudents: $forStudents
        forParents: $forParents
        onHomePage: $onHomePage
        forPbis: $forPbis
        forEPortfolio: $forEPortfolio
      }
    ) {
      id
    }
  }
`;

const DELETE_LINK_MUTATION = gql`
  mutation DELETE_LINK_MUTATION($id: ID!) {
    deleteLink(where: { id: $id }) {
      id
    }
  }
`;

const EditLink: React.FC<EditLinkProps> = ({
  link,
  refetch,
  setVisibleForm,
  visibleForm,
}) => {
  const revalidateIndex = useRevalidatePage('/');
  const revalidateLinksPage = useRevalidatePage('/links');
  const [showForm, setShowForm] = useState(false);
  const { inputs, handleChange, clearForm, resetForm } = useForm({
    name: link.name,
    description: link.description || '',
    link: link.link || '',
    forTeachers: link.forTeachers ?? false,
    forStudents: link.forStudents ?? false,
    forParents: link.forParents ?? false,
    onHomePage: link.onHomePage ?? false,
    forPbis: link.forPbis ?? false,
    forEPortfolio: link.forEPortfolio ?? false,
  });
  const user = useUser();

  const [updateLink, { loading, error }] = useGqlMutation<
    UpdateLinkData,
    UpdateLinkVariables
  >(UPDATE_LINK_MUTATION);

  const [deleteLink, { loading: deleteLoading, error: deleteError }] =
    useGqlMutation<DeleteLinkData, DeleteLinkVariables>(DELETE_LINK_MUTATION);
  const queryClient = useQueryClient();

  const isVisible = useMemo(() => {
    if (visibleForm === link.id) {
      return true;
    }
    return false;
  }, [link, visibleForm]);

  return (
    <div>
      <SmallGradientButton
        onClick={() => {
          isVisible ? setVisibleForm(null) : setVisibleForm(link.id);
        }}
      >
        {showForm ? 'close' : 'Edit Link'}
      </SmallGradientButton>
      <FormDialog
        isOpen={visibleForm === link.id}
        onClose={() => setVisibleForm(null)}
        title="Edit Link"
        size="md"
      >
        <Form
          className="w-full bg-transparent border-0 shadow-none p-0"
          onSubmit={async (e) => {
            e.preventDefault();
            await updateLink({
              id: link.id,
              name: inputs.name,
              description: inputs.description,
              link: inputs.link,
              forTeachers: inputs.forTeachers,
              forStudents: inputs.forStudents,
              forParents: inputs.forParents,
              onHomePage: inputs.onHomePage,
              forPbis: inputs.forPbis,
              forEPortfolio: inputs.forEPortfolio,
            });
            refetch?.();
            setVisibleForm(null);
          }}
        >
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
              + Publish
            </button>
            {user?.isSuperAdmin ? (
              <button
                type="button"
                onClick={async () => {
                  await deleteLink({ id: link.id });
                  revalidateIndex();
                  revalidateLinksPage();
                  queryClient.refetchQueries('allLinks');
                  setVisibleForm(null);
                }}
                className="ml-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
              >
                Delete
              </button>
            ) : null}
          </fieldset>
        </Form>
      </FormDialog>
    </div>
  );
};

export default EditLink;
