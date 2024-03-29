import { useMutation } from "@apollo/client";
import gql from "graphql-tag";
import { useState } from "react";
import { useQueryClient } from "react-query";
import useForm from "../../lib/useForm";
import { useGQLQuery } from "../../lib/useGqlQuery";
import DisplayError from "../ErrorMessage";
import GradientButton, { SmallGradientButton } from "../styles/Button";
import Form, { FormContainerStyles } from "../styles/Form";

const UPDATE_STUDENT_MUTATION = gql`
  mutation UPDATE_STUDENT_MUTATION(
    $id: ID!
    $name: String!
    $ta: ID!
    $block1: ID!
    $block2: ID!
    $block3: ID!
    $block4: ID!
    $block5: ID!
    $block6: ID
    $block7: ID
    $block8: ID
    $block9: ID
    $block10: ID
  ) {
    updateUser(
      where: { id: $id }
      data: {
        name: $name
        taTeacher: { connect: { id: $ta } }
        block1Teacher: { connect: { id: $block1 } }
        block2Teacher: { connect: { id: $block2 } }
        block3Teacher: { connect: { id: $block3 } }
        block4Teacher: { connect: { id: $block4 } }
        block5Teacher: { connect: { id: $block5 } }
        block6Teacher: { connect: { id: $block6 } }
        block7Teacher: { connect: { id: $block7 } }
        block8Teacher: { connect: { id: $block8 } }
        block9Teacher: { connect: { id: $block9 } }
        block10Teacher: { connect: { id: $block10 } }
      }
    ) {
      id
    }
  }
`;

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
export default function EditStudent({ student }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, error } = useGQLQuery(
    `ListOfTeachers`,
    LIST_OF_TEACHERS_QUERY,
    {},
    { enabled: showForm }
  );
  const { inputs, handleChange, clearForm, resetForm } = useForm({
    name: student.name,
    ta: student.taTeacher?.id,
    block1: student.block1Teacher?.id,
    block2: student.block2Teacher?.id,
    block3: student.block3Teacher?.id,
    block4: student.block4Teacher?.id,
    block5: student.block5Teacher?.id,
    block6: student.block6Teacher?.id,
    block7: student.block7Teacher?.id,
    block8: student.block8Teacher?.id,
    block9: student.block9Teacher?.id,
    block10: student.block10Teacher?.id,
  });

  const [updateStudent, { loading }] = useMutation(UPDATE_STUDENT_MUTATION, {
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
        {showForm ? "close" : "Edit Student"}
      </GradientButton>
      <FormContainerStyles>
        <Form
          className={showForm ? "visible" : "hidden"}
          style={{ width: "500px" }}
          onSubmit={async (e) => {
            e.preventDefault();
            // Submit the input fields to the backend:
            // console.log(inputs);
            const res = await updateStudent();
            queryClient.refetchQueries();
            setShowForm(false);
            // console.log(inputs);
          }}
        >
          <h2>Edit {student.name}'s Schedule</h2>
          <DisplayError error={error} />
          <fieldset disabled={loading} aria-busy={loading}>
            {/* <FormGroupStyles> */}
            <label htmlFor="name">
              Name
              <input
                style={{ marginLeft: "0" }}
                required
                type="text"
                id="name"
                name="name"
                placeholder="Title of Assignment"
                value={inputs.name || ""}
                onChange={handleChange}
              />
            </label>
            {/* </FormGroupStyles> */}
            <label htmlFor="ta">
              TA
              <select
                id="ta"
                name="ta"
                placeholder="TA Teacher"
                value={inputs.ta}
                onChange={handleChange}
              >
                {teacherList.map((item) => (
                  <option key={`item${item.name}`} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="block1">
              Block 1
              <select
                id="block1"
                name="block1"
                placeholder="Block 1 Teacher"
                value={inputs.block1}
                onChange={handleChange}
              >
                {teacherList.map((item) => (
                  <option key={`item${item.name}`} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="block2">
              Block 2
              <select
                id="block2"
                name="block2"
                placeholder="Block 2 Teacher"
                value={inputs.block2}
                onChange={handleChange}
              >
                {teacherList.map((item) => (
                  <option key={`item${item.name}`} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="block3">
              Block 3
              <select
                id="block3"
                name="block3"
                placeholder="Block 3 Teacher"
                value={inputs.block3}
                onChange={handleChange}
              >
                {teacherList.map((item) => (
                  <option key={`item${item.name}`} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="block4">
              Block 4
              <select
                id="block4"
                name="block4"
                placeholder="Block 4 Teacher"
                value={inputs.block4}
                onChange={handleChange}
              >
                {teacherList.map((item) => (
                  <option key={`item${item.name}`} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="block5">
              Block 5
              <select
                id="block5"
                name="block5"
                placeholder="Block 5 Teacher"
                value={inputs.block5}
                onChange={handleChange}
              >
                {teacherList.map((item) => (
                  <option key={`item${item.name}`} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="block6">
              Block 6
              <select
                id="block6"
                name="block6"
                placeholder="Block 6 Teacher"
                value={inputs.block6}
                onChange={handleChange}
              >
                {teacherList.map((item) => (
                  <option key={`item${item.name}`} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="block7">
              Block 7
              <select
                id="block7"
                name="block7"
                placeholder="Block 7 Teacher"
                value={inputs.block7}
                onChange={handleChange}
              >
                {teacherList.map((item) => (
                  <option key={`item${item.name}`} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="block8">
              Block 8
              <select
                id="block8"
                name="block8"
                placeholder="Block 8 Teacher"
                value={inputs.block8}
                onChange={handleChange}
              >
                {teacherList.map((item) => (
                  <option key={`item${item.name}`} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="block9">
              Block 8
              <select
                id="block9"
                name="block9"
                placeholder="Block 9 Teacher"
                value={inputs.block9}
                onChange={handleChange}
              >
                {teacherList.map((item) => (
                  <option key={`item${item.name}`} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="block10">
              Block 8
              <select
                id="block10"
                name="block10"
                placeholder="Block 10 Teacher"
                value={inputs.block10}
                onChange={handleChange}
              >
                {teacherList.map((item) => (
                  <option key={`item${item.name}`} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <button type="submit">+ Publish</button>
            <button type="button" onClick={resetForm}>
              Undo
            </button>
          </fieldset>
        </Form>
      </FormContainerStyles>
    </div>
  );
}
