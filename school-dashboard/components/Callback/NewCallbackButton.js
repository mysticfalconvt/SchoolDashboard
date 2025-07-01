import { useState } from 'react';
import { useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import { useRouter } from 'next/dist/client/router';
import toast from 'react-hot-toast';
import GradientButton from '../styles/Button';
import Form, { FormContainer, FormGroup } from '../styles/Form';
import useForm from '../../lib/useForm';
import DisplayError from '../ErrorMessage';
import SearchForUserName from '../SearchForUserName';
import { todaysDateForForm } from '../calendars/formatTodayForForm';
import useRecalculateCallback from './recalculateCallback';
import { useUser } from '../User';
import useCreateMessage from '../Messages/useCreateMessage';

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
    }
  }
`;

export default function NewCallback({ refetch }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const { inputs, handleChange, clearForm, resetForm } = useForm({
    dateAssigned: todaysDateForForm(),
  });
  const user = useUser();
  const [studentCallbackIsFor, setStudentCallbackIsFor] = useState(null);

  const [createCallback, { loading, error, data }] = useMutation(
    CREATE_CALLBACK_MUTATION,
    {
      variables: {
        ...inputs,
        dateAssigned: new Date(inputs.dateAssigned.concat('T24:00:00.000Z')),
        teacher: user?.id,
        student: studentCallbackIsFor?.userId,
      },
    }
  );
  // TODO: send message when callback assigned
  const createMessage = useCreateMessage();

  const { setCallbackID } = useRecalculateCallback();
  //   console.log(inputs);
  return (
    <div>
      <GradientButton
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? 'Close the form' : 'New Callback Assignment'}
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
            <Form className="w-full bg-transparent border-0 shadow-none p-0" onSubmit={async (e) => {
              e.preventDefault();
              const res = await createCallback();
              setCallbackID(res.data.createCallback.id);
              createMessage({
                subject: 'New Callback Assignment',
                message: `you received a new callback item from ${user.name}`,
                receiver: studentCallbackIsFor?.userId,
                link: `/callback/${res?.data?.createCallback.id}`,
              });
              refetch();
              resetForm();
              toast.success(
                `Created Callback for ${studentCallbackIsFor?.userName}`
              );
              router.push({
                pathname: `/callback/${res.data.createCallback.id}`,
              });
            }}>
              <h1 className="text-white font-bold text-xl mb-4">Add a New Callback Assignment</h1>
              <DisplayError error={error} />
              <fieldset disabled={loading} aria-busy={loading}>
                <div className="mb-4">
                  <label htmlFor="studentName" className="block text-white font-semibold mb-1">
                    Student Name
                  </label>
                  <SearchForUserName
                    name="studentName"
                    updateUser={setStudentCallbackIsFor}
                    userType="isStudent"
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
                    value={inputs.title || ''}
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
                <button type="submit" className="mt-6">+ Publish</button>
              </fieldset>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
