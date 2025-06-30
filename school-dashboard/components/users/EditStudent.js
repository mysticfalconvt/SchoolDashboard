import { useMutation } from "@apollo/client";
import gql from "graphql-tag";
import { useState } from "react";
import { useQueryClient } from "react-query";
import useForm from "../../lib/useForm";
import { useGQLQuery } from "../../lib/useGqlQuery";
import DisplayError from "../ErrorMessage";
import GradientButton from "../styles/Button";
import Form, { FormContainer } from "../styles/Form";
import { NUMBER_OF_BLOCKS } from "../../config";

const LIST_OF_TEACHERS_QUERY = gql`
  query {
    teacherList: users(
      where: {
        AND: [
          { isTeacher: { equals: true } }
          {
            OR: [{ hasClasses: { equals: true } }, { hasTA: { equals: true } }]
          }
        ]
      }
    ) {
      id
      name
    }
  }
`;
// Generate the dynamic mutation string
const generateMutation = (numberOfBlocks) => {
  const blockInputs = Array.from(
    { length: numberOfBlocks },
    (_, i) => `$block${i + 1}: ID`
  ).join(" ");
  const blockData = Array.from(
    { length: numberOfBlocks },
    (_, i) => `block${i + 1}Teacher: { connect: { id: $block${i + 1} } }`
  ).join(" ");

  return gql`
    mutation UPDATE_STUDENT_MUTATION(
      $id: ID!
      $name: String!
      $ta: ID!
      ${blockInputs}
    ) {
      updateUser(
        where: { id: $id }
        data: {
          name: $name
          taTeacher: { connect: { id: $ta } }
          ${blockData}
        }
      ) {
        id
      }
    }
  `;
};

export default function EditStudent({ student }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, error } = useGQLQuery(
    `ListOfTeachers`,
    LIST_OF_TEACHERS_QUERY,
    {},
    { enabled: showForm }
  );

  const initialInputs = {
    name: student.name,
    ta: student.taTeacher?.id,
    ...Array.from({ length: NUMBER_OF_BLOCKS }, (_, i) => ({
      [`block${i + 1}`]: student[`block${i + 1}Teacher`]?.id,
    })).reduce((acc, curr) => ({ ...acc, ...curr }), {}),
  };

  const { inputs, handleChange, clearForm, resetForm } = useForm(initialInputs);
  const mutation = generateMutation(NUMBER_OF_BLOCKS);

  const [updateStudent, { loading }] = useMutation(mutation, {
    variables: {
      ...inputs,
      id: student.id,
    },
  });

  const teacherListRaw = data?.teacherList || [];
  const teacherList = teacherListRaw.sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div>
      <GradientButton onClick={() => setShowForm(!showForm)}>
        {showForm ? "Close" : "Edit Student"}
      </GradientButton>
      <FormContainer visible={showForm}>
        <Form
          className={showForm ? "visible" : "hidden"}
          style={{ width: "500px" }}
          onSubmit={async (e) => {
            e.preventDefault();
            const res = await updateStudent();
            queryClient.refetchQueries();
            setShowForm(false);
          }}
        >
          <h2>Edit {student.name}'s Schedule</h2>
          <DisplayError error={error} />
          <fieldset disabled={loading} aria-busy={loading}>
            <label htmlFor="name">
              Name
              <input
                style={{ marginLeft: "0" }}
                required
                type="text"
                id="name"
                name="name"
                value={inputs.name || ""}
                onChange={handleChange}
              />
            </label>
            <label htmlFor="ta">
              TA
              <select
                id="ta"
                name="ta"
                value={inputs.ta}
                onChange={handleChange}
              >
                {teacherList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            {Array.from({ length: NUMBER_OF_BLOCKS }, (_, i) => (
              <label key={`block${i + 1}`} htmlFor={`block${i + 1}`}>
                Block {i + 1}
                <select
                  id={`block${i + 1}`}
                  name={`block${i + 1}`}
                  value={inputs[`block${i + 1}`]}
                  onChange={handleChange}
                >
                  {teacherList.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            <button type="submit">+ Publish</button>
            <button type="button" onClick={resetForm}>
              Undo
            </button>
          </fieldset>
        </Form>
      </FormContainer>
    </div>
  );
}
