import { useMemo, useState } from "react";
import { useMutation } from "@apollo/client";
import gql from "graphql-tag";
import { useQueryClient } from "react-query";
import GradientButton, { SmallGradientButton } from "../styles/Button";
import Form, { FormContainer, FormGroup } from "../styles/Form";
import useForm from "../../lib/useForm";
import DisplayError from "../ErrorMessage";

import { useUser } from "../User";
import useRevalidatePage from "../../lib/useRevalidatePage";
import Toggle from "react-toggle";
import "react-toggle/style.css";

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

export default function EditLink({
  link,
  refetch,
  setVisibleForm,
  visibleForm,
}) {
  const revalidateIndex = useRevalidatePage("/");
  const revalidateLinksPage = useRevalidatePage("/links");
  const [showForm, setShowForm] = useState(false);
  const { inputs, handleChange, clearForm, resetForm } = useForm({
    name: link.name,
    description: link.description,
    link: link.link,
    forTeachers: link.forTeachers ?? false,
    forStudents: link.forStudents ?? false,
    forParents: link.forParents ?? false,
    onHomePage: link.onHomePage ?? false,
    forPbis: link.forPbis ?? false,
    forEPortfolio: link.forEPortfolio ?? false,
  });
  const user = useUser();

  const [updateLink, { loading, error }] = useMutation(UPDATE_LINK_MUTATION, {
    variables: {
      ...inputs,
      id: link.id,
    },
  });
  const [deleteLink, { loading: deleteLoading, error: deleteError }] =
    useMutation(DELETE_LINK_MUTATION, {
      variables: {
        id: link.id,
      },
    });
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
        {showForm ? "close" : "Edit Link"}
      </SmallGradientButton>
      <FormContainer visible={visibleForm === link.id}>
        <div className="bg-gradient-to-tl from-[var(--red)] to-[var(--blue)] border-[5px] border-[var(--tableAccentColor)] rounded-xl shadow-2xl p-6 relative w-full max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setVisibleForm(null)}
            className="absolute top-2 right-2 text-white text-2xl font-bold bg-black bg-opacity-40 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70 focus:outline-none"
            aria-label="Close"
          >
            ×
          </button>
          <Form className="w-full bg-transparent border-0 shadow-none p-0">
            <h1 className="text-white font-bold text-xl mb-4">Edit Link</h1>
            <DisplayError error={error} />
            <fieldset disabled={loading} aria-busy={loading}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-white font-semibold mb-1">
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
                <label htmlFor="link" className="block text-white font-semibold mb-1">
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
                <label htmlFor="description" className="block text-white font-semibold mb-1">
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
              <div className="mt-4 mb-2 font-bold text-white">Visibility Options</div>
              <div className="flex flex-col gap-2">
                {[{ id: "forTeachers", label: "Visible to Teachers" },
                { id: "forStudents", label: "Visible to Students" },
                { id: "forParents", label: "Visible to Parents" },
                { id: "onHomePage", label: "Show on The HomePage" },
                { id: "forPbis", label: "Show on The PBIS Page" },
                { id: "forEPortfolio", label: "Show on The E-Portfolio Page" }].map(({ id, label }) => (
                  <label key={id} htmlFor={id} className="flex items-center justify-between text-white font-medium">
                    <span>{label}</span>
                    <Toggle
                      id={id}
                      name={id}
                      checked={inputs[id]}
                      onChange={handleChange}
                    />
                  </label>
                ))}
              </div>
              <button type="submit" className="mt-6">+ Publish</button>
              {user?.isSuperAdmin ? (
                <button
                  type="button"
                  onClick={async () => {
                    const res = await deleteLink();
                    revalidateIndex();
                    revalidateLinksPage();
                    queryClient.refetchQueries("allLinks");
                    setVisibleForm(null);
                  }}
                  className="ml-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                >
                  Delete
                </button>
              ) : null}
            </fieldset>
          </Form>
        </div>
      </FormContainer>
    </div>
  );
}
