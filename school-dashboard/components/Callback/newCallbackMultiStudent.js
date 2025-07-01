import { useState } from "react";
import { useMutation } from "@apollo/client";
import gql from "graphql-tag";
import { useRouter } from "next/dist/client/router";
import toast from "react-hot-toast";
import GradientButton from "../styles/Button";
import Form, { FormContainer, FormGroup } from "../styles/Form";
import useForm from "../../lib/useForm";
import DisplayError from "../ErrorMessage";
import SearchForUserName from "../SearchForUserName";
import { todaysDateForForm } from "../calendars/formatTodayForForm";
import useRecalculateCallback from "./recalculateCallback";
import { useUser } from "../User";
import useCreateMessage from "../Messages/useCreateMessage";
import { useGQLQuery } from "../../lib/useGqlQuery";
import StudentList from "./StudentListForMultiSelectCallback";

const CREATE_CALLBACK_MUTATION = gql`
  mutation CREATE_CALLBACK_MUTATION(
    $title: String!
    $dateAssigned: DateTime
    $teacher: ID!
    $student: ID!
    $description: String
    $link: String
  ) {
    createCallback(
      data: {
        title: $title
        dateAssigned: $dateAssigned
        teacher: { connect: { id: $teacher } }
        student: { connect: { id: $student } }
        description: $description
        link: $link
      }
    ) {
      id
      student {
        id
        name
      }
    }
  }
`;

const USERS_CLASS_STUDENTS_QUERY = gql`
  query {
    authenticatedItem {
      ... on User {
        block1Students(orderBy: { name: asc }) {
          id
          name
        }
        block2Students(orderBy: { name: asc }) {
          id
          name
        }
        block3Students(orderBy: { name: asc }) {
          id
          name
        }
        block4Students(orderBy: { name: asc }) {
          id
          name
        }
        block5Students(orderBy: { name: asc }) {
          id
          name
        }
        block6Students(orderBy: { name: asc }) {
          id
          name
        }
        block7Students(orderBy: { name: asc }) {
          id
          name
        }
        block8Students(orderBy: { name: asc }) {
          id
          name
        }
        block9Students(orderBy: { name: asc }) {
          id
          name
        }
        block10Students(orderBy: { name: asc }) {
          id
          name
        }
      }
    }
  }
`;

export default function NewCallbackMultiStudent({ refetch }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const { inputs, handleChange, clearForm, resetForm } = useForm({
    dateAssigned: todaysDateForForm(),
    title: "",
    description: "",
    link: "",
  });
  const user = useUser();
  const [studentsCallbackIsFor, setStudentsCallbackIsFor] = useState([]);

  const [createCallback, { loading, error }] = useMutation(
    CREATE_CALLBACK_MUTATION,
    {
      variables: {
        ...inputs,
        dateAssigned: new Date(inputs.dateAssigned.concat("T24:00:00.000Z")),
        teacher: user?.id,
        student: studentsCallbackIsFor?.userId,
      },
    }
  );

  const { data, isLoading } = useGQLQuery(
    "myClassStudents",
    USERS_CLASS_STUDENTS_QUERY,
    {},
    {
      // enabled: !!showForm,
    }
  );
  // console.log(data);
  const createMessage = useCreateMessage();

  const { setCallbackID } = useRecalculateCallback();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Submit the input fields to the backend:
    // console.log(studentsCallbackIsFor);
    if (studentsCallbackIsFor?.length > 0) {
      for (const student of studentsCallbackIsFor) {
        const res = await createCallback({
          variables: {
            ...inputs,
            dateAssigned: new Date(
              inputs.dateAssigned.concat("T24:00:00.000Z")
            ),
            teacher: user?.id,
            student,
          },
        });
        setCallbackID(res.data.createCallback.id);
        // console.log(res);
        createMessage({
          subject: "New Callback Assignment",
          message: `you received a new callback item from ${res.data.createCallback.student.name}`,
          receiver: student,
          link: `/callback/${res?.data?.createCallback.id}`,
        });
        toast.success(
          `Created Callback for ${res.data.createCallback.student.name}`
        );
      }
      refetch();
      resetForm();
      setStudentsCallbackIsFor([]);
      setShowForm(false);
    } else {
      toast.error("Please select at least one student");
    }
  };
  //   console.log(inputs);
  return (
    <div>
      <GradientButton
        onClick={() => setShowForm(!showForm)}
      >
        {showForm
          ? "Close the form"
          : "New Callback Assignment For Multiple Students"}
      </GradientButton>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-gradient-to-tl from-[var(--red)] to-[var(--blue)] border-[5px] border-[var(--tableAccentColor)] rounded-xl shadow-2xl p-6 relative w-[80vw] max-w-4xl mx-auto">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="absolute top-2 right-2 text-white text-2xl font-bold bg-black bg-opacity-40 rounded-full w-10 h-8 flex items-center justify-center hover:bg-opacity-70 focus:outline-none"
              aria-label="Close"
            >
              ×
            </button>
            <Form className="w-full bg-transparent border-0 shadow-none p-0">
              <h1 className="text-white font-bold text-xl mb-4">Add a New Callback Assignment</h1>
              <DisplayError error={error} />
              <fieldset disabled={loading} aria-busy={loading}>
                <div className="mb-4">
                  <label className="block text-white font-semibold mb-1">
                    Select Students
                  </label>
                  <StudentList
                    studentList={data?.authenticatedItem}
                    selectedStudents={studentsCallbackIsFor}
                    setSelectedStudents={setStudentsCallbackIsFor}
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="title" className="block text-white font-semibold mb-1">
                    Assignment
                  </label>
                  <input
                    required
                    type="text"
                    id="title"
                    name="title"
                    placeholder="Title of Assignment"
                    value={inputs.title || ""}
                    onChange={handleChange}
                    className="w-full p-2 rounded border"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="dateAssigned" className="block text-white font-semibold mb-1">
                    Due Date
                  </label>
                  <input
                    required
                    type="date"
                    id="dateAssigned"
                    name="dateAssigned"
                    value={inputs.dateAssigned}
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
                    placeholder="Assignment Description"
                    required
                    value={inputs.description}
                    onChange={handleChange}
                    rows="5"
                    className="w-full p-2 rounded border"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="link" className="block text-white font-semibold mb-1">
                    Link
                  </label>
                  <input
                    id="link"
                    name="link"
                    placeholder="Link to website"
                    value={inputs.link}
                    onChange={handleChange}
                    className="w-full p-2 rounded border"
                  />
                </div>
                <button type="button" onClick={handleSubmit} className="mt-6">
                  + Publish
                </button>
              </fieldset>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
