import DisplayError from '@/components/ErrorMessage';
import useCreateMessage from '@/components/Messages/useCreateMessage';
import SearchForUserName from '@/components/SearchForUserName';
import Form, { FormGroupStyles } from '@/components/styles/Form';
import { useUser } from '@/components/User';
import useForm from '@/lib/useForm';
import { useGqlMutation } from '@/lib/useGqlMutation';
import gql from 'graphql-tag';
import { useRouter } from 'next/dist/client/router';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import useRecalculateCallback from './recalculateCallback';

const DUPLICATE_CALLBACK_MUTATION = gql`
  mutation DUPLICATE_CALLBACK_MUTATION(
    $title: String!
    $dateAssigned: DateTime
    $description: String
    $link: String
    $teacher: ID!
    $student: ID!
    $messageFromTeacher: String
  ) {
    createCallback(
      data: {
        teacher: { connect: { id: $teacher } }
        student: { connect: { id: $student } }
        title: $title
        dateAssigned: $dateAssigned
        description: $description
        link: $link
        messageFromTeacher: $messageFromTeacher
      }
    ) {
      id
    }
  }
`;

interface Callback {
  id: string;
  title: string;
  description?: string;
  link?: string;
  dateAssigned: string;
}

interface StudentUser {
  userId: string;
  userName: string;
}

interface FormInputs {
  dateAssigned: string;
  title: string;
  description: string;
  link: string;
}

interface User {
  id: string;
  name: string;
}

interface DuplicateCallbackProps {
  callback: Callback;
  setDuplicating: (duplicating: boolean) => void;
}

export default function DuplicateCallback({
  callback,
  setDuplicating,
}: DuplicateCallbackProps) {
  const router = useRouter();
  const date = new Date(callback.dateAssigned);
  // set date to the day before
  date.setDate(date.getDate() - 1);
  const { inputs, handleChange, clearForm, resetForm } = useForm({
    dateAssigned: date.toISOString().split('T')[0],
    title: callback.title,
    description: callback.description,
    link: callback.link,
  });
  const user = useUser() as User;
  const [studentCallbackIsFor, setStudentCallbackIsFor] =
    useState<StudentUser | null>(null);
  // console.log(studentCallbackIsFor);
  const [updateCallback, { loading, error, data }] = useGqlMutation(
    DUPLICATE_CALLBACK_MUTATION,
  );
  // TODO: send message when callback assigned
  const createMessage = useCreateMessage();

  const { setCallbackID } = useRecalculateCallback();
  //   console.log(inputs);
  return (
    <div>
      {/* <FormContainerStyles> */}
      <Form
        className="visible"
        // hidden={!showForm}
        onSubmit={async (e) => {
          e.preventDefault();
          // Submit the input fields to the backend:
          // console.log(inputs);
          await updateCallback({
            ...inputs,
            dateAssigned: new Date(
              inputs.dateAssigned.concat('T24:00:00.000Z'),
            ),
            student: studentCallbackIsFor?.userId,
            teacher: user?.id,
          });
          // console.log(res);
          createMessage({
            subject: 'New Callback Assignment',
            message: `you received a new callback item from ${user.name}`,
            receiver: studentCallbackIsFor?.userId,
            link: `/callback/new`,
          });

          setCallbackID('new');
          router.push({
            pathname: `/callback/new`,
          });
          toast.success(
            `Created Callback for ${studentCallbackIsFor?.userName}`,
          );
          setDuplicating(false);
          // console.log(inputs);
        }}
      >
        <h2>Edit Callback Assignment</h2>
        <DisplayError error={error as any} />
        <fieldset disabled={loading} aria-busy={loading}>
          <FormGroupStyles>
            <label htmlFor="studentName">Student Name</label>
            <SearchForUserName
              name="studentName"
              value=""
              updateUser={setStudentCallbackIsFor}
              userType="isStudent"
            />

            <label htmlFor="title">
              Assignment
              <input
                required
                type="text"
                id="title"
                name="title"
                placeholder="Title of Assignment"
                value={inputs.title || ''}
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
          </FormGroupStyles>
          <label htmlFor="description">
            Description
            <textarea
              id="description"
              name="description"
              placeholder="Assignment Description"
              required
              value={inputs.description}
              onChange={handleChange}
              rows={5}
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
      {/* </FormContainerStyles> */}
    </div>
  );
}
