import { useState } from "react";
import { useMutation } from "@apollo/client";
import gql from "graphql-tag";
import GradientButton from "../styles/Button";
import Form, { FormContainer, FormGroup } from "../styles/Form";
import useForm from "../../lib/useForm";
import DisplayError from "../ErrorMessage";

import { useUser } from "../User";
import useCreateMessage from "../Messages/useCreateMessage";

const UPDATE_CALLBACK_MUTATION = gql`
  mutation UPDATE_CALLBACK_MUTATION(
    $id: ID!
    $title: String!
    $dateAssigned: DateTime
    $description: String
    $link: String
  ) {
    updateCallback(
      where: { id: $id }
      data: {
        title: $title
        dateAssigned: $dateAssigned
        description: $description
        link: $link
      }
    ) {
      id
    }
  }
`;

export default function CallbackEditor({ callback, refetch, setEditing }) {
  const date = new Date(callback.dateAssigned);
  const { inputs, handleChange, clearForm, resetForm } = useForm({
    dateAssigned: date.toISOString().split("T")[0],
    title: callback.title,
    description: callback.description,
    link: callback.link,
  });
  const user = useUser();
  const [studentCallbackIsFor, setStudentCallbackIsFor] = useState(null);

  const [updateCallback, { loading, error, data }] = useMutation(
    UPDATE_CALLBACK_MUTATION,
    {
      variables: {
        ...inputs,
        dateAssigned: new Date(inputs.dateAssigned),
        id: callback.id,
      },
    }
  );
  // TODO: send message when callback assigned
  const createMessage = useCreateMessage();

  return (
    <div>
      {/* <FormContainer visible={showForm}> */}
      <Form
        className={showForm ? "visible" : "hidden"}
        onSubmit={async (e) => {
          e.preventDefault();
          // Submit the input fields to the backend:
          // console.log(inputs);
          const res = await updateCallback();

          createMessage({
            subject: "Updated Callback Assignment",
            message: `${user.name} updated a callback item`,
            receiver: callback.student.id,
            link: `/callback/${res?.data?.updateCallback.id}`,
          });
          refetch();
          setEditing(false);

          // console.log(inputs);
        }}
      >
        <h2>Edit Callback Assignment</h2>
        <DisplayError error={error} />
        <fieldset disabled={loading} aria-busy={loading}>
          <FormGroup>
            <div>
              <label htmlFor="studentName">Student Name</label>
              <p>{callback.student.name}</p>
            </div>

            <label htmlFor="title">
              Assignment
              <input
                required
                type="text"
                id="title"
                name="title"
                placeholder="Title of Assignment"
                value={inputs.title || ""}
                onChange={handleChange}
              />
            </label>
            <label htmlFor="dateAssigned">
              Due Date
              <input
                required
                type="date"
                id="dateAssigned"
                name="dateAssigned"
                value={inputs.dateAssigned}
                onChange={handleChange}
              />
            </label>
          </FormGroup>
          <label htmlFor="description">
            Description
            <textarea
              id="description"
              name="description"
              placeholder="Assignment Description"
              required
              value={inputs.description}
              onChange={handleChange}
              rows="5"
            />
          </label>
          <label htmlFor="link">
            Link
            <input
              id="link"
              name="link"
              placeholder="Link to website"
              value={inputs.link}
              onChange={handleChange}
            />
          </label>
          <button type="submit">+ Publish</button>
        </fieldset>
      </Form>
      {/* </FormContainer> */}
    </div>
  );
}
