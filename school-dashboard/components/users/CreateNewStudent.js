import { useMutation } from "@apollo/client";
import gql from "graphql-tag";
import { useState } from "react";
import toast from "react-hot-toast";
import { useQueryClient } from "react-query";
import useForm from "../../lib/useForm";
import { useGQLQuery } from "../../lib/useGqlQuery";
import useRevalidatePage from "../../lib/useRevalidatePage";
import DisplayError from "../ErrorMessage";
import GradientButton, { SmallGradientButton } from "../styles/Button";
import Form, { FormContainerStyles } from "../styles/Form";
import Link from "next/link";

// TODO: update this edit into create new student

const CREATE_NEW_STUDENT_MUTATION = gql`
  mutation CREATE_NEW_STUDENT_MUTATION(
    $name: String!
    $email: String!
    $ta: ID!
    $block1: ID!
    $block2: ID!
    $block3: ID!
    $block4: ID!
    $block5: ID!
    $block6: ID!
    $block7: ID!
    $block8: ID!
    $block9: ID!
    $block10: ID!
  ) {
    createUser(
      data: {
        name: $name
        email: $email
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
        isStudent: true
        password: "password"
      }
    ) {
      id
      name
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
export default function NewStudent({ student }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const revalidateIndexPage = useRevalidatePage("/");
  const { data, isLoading } = useGQLQuery(
    `ListOfTeachers`,
    LIST_OF_TEACHERS_QUERY,
    {},
    { enabled: showForm }
  );
  const { inputs, handleChange, clearForm, resetForm } = useForm({
    name: "",
    email: "",
    ta: "",
    block1: "",
    block2: "",
    block3: "",
    block4: "",
    block5: "",
    block6: "",
    block7: "",
    block8: "",
    block9: "",
    block10: "",
  });

  const [createNewStudent, { loading, error }] = useMutation(
    CREATE_NEW_STUDENT_MUTATION,
    {
      variables: {
        ...inputs,
        email: inputs.email.toLowerCase(),
      },
    }
  );
  const teacherListRaw = data?.teacherList || [];
  const teacherList = teacherListRaw.sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div>
      <GradientButton onClick={() => setShowForm(!showForm)}>
        {showForm ? "Close the form" : "Create a New Student"}
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
                Create New Student
              </h4>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="w-8 h-8 text-white bg-[var(--redTrans)] hover:bg-[var(--blue)] rounded-full flex items-center justify-center text-lg font-bold transition-colors duration-200"
              >
                ×
              </button>
            </div>
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <Form
                className="w-full bg-transparent border-0 shadow-none p-0"
                onSubmit={async (e) => {
                  e.preventDefault();
                  // Submit the input fields to the backend:
                  const res = await createNewStudent();
                  if (res.data.createUser) {
                    queryClient.refetchQueries();
                    setShowForm(false);
                    resetForm();
                    toast.success(
                      <Link href={`/userProfile/${res.data.createUser.id}`}>
                        {`Created a new account for ${res.data.createUser.name}   Click here to view their profile`}
                      </Link>,
                      { duration: 10000 }
                    );
                    revalidateIndexPage();
                  } else {
                    toast.error(`Error creating new account`);
                  }
                }}
              >
                <DisplayError error={error} />
                <fieldset disabled={loading} aria-busy={loading} className="border-0 p-0">
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-white font-semibold mb-1">
                      Name
                    </label>
                    <input
                      style={{ marginLeft: "0" }}
                      required
                      type="text"
                      id="name"
                      name="name"
                      placeholder="Student Name"
                      value={inputs.name || ""}
                      onChange={handleChange}
                      className="w-full p-2 rounded border"
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-white font-semibold mb-1">
                      Email
                    </label>
                    <input
                      style={{ marginLeft: "0" }}
                      required
                      type="email"
                      id="email"
                      name="email"
                      placeholder="Student Email"
                      value={inputs.email || ""}
                      onChange={handleChange}
                      className="w-full p-2 rounded border"
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="ta" className="block text-white font-semibold mb-1">
                      TA
                    </label>
                    <select
                      id="ta"
                      name="ta"
                      placeholder="TA Teacher"
                      value={inputs.ta}
                      onChange={handleChange}
                      required
                      className="w-full p-2 rounded border"
                    >
                      <option value="" disabled>
                        None
                      </option>
                      {teacherList.map((item) => (
                        <option key={`item${item.name}`} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Repeat for all blocks */}
                  {[...Array(10)].map((_, i) => (
                    <div className="mb-4" key={`block${i + 1}`}>
                      <label htmlFor={`block${i + 1}`} className="block text-white font-semibold mb-1">
                        Block {i + 1}
                      </label>
                      <select
                        id={`block${i + 1}`}
                        name={`block${i + 1}`}
                        placeholder={`Block ${i + 1} Teacher`}
                        value={inputs[`block${i + 1}`]}
                        onChange={handleChange}
                        required
                        className="w-full p-2 rounded border"
                      >
                        <option value="" disabled>
                          None
                        </option>
                        {teacherList.map((item) => (
                          <option key={`block${i + 1}-${item.name}`} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                  <button type="submit" className="mt-6">+ Create Student</button>
                </fieldset>
              </Form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
