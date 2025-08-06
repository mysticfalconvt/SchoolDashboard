import DisplayError from '@/components/ErrorMessage';
import useCreateMessage from '@/components/Messages/useCreateMessage';
import { useUser } from '@/components/User';
import { todaysDateForForm } from '@/components/calendars/formatTodayForForm';
import GradientButton from '@/components/styles/Button';
import { FormDialog } from '@/components/styles/Dialog';
import Form from '@/components/styles/Form';
import useForm from '@/lib/useForm';
import { useGqlMutation } from '@/lib/useGqlMutation';
import { useGQLQuery } from '@/lib/useGqlQuery';
import gql from 'graphql-tag';
import { useRouter } from 'next/dist/client/router';
import { useState } from 'react';
import toast from 'react-hot-toast';
import StudentList from './StudentListForMultiSelectCallback';
import useRecalculateCallback from './recalculateCallback';

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

interface NewCallbackMultiStudentProps {
  refetch: () => void;
}

export default function NewCallbackMultiStudent({
  refetch,
}: NewCallbackMultiStudentProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const { inputs, handleChange, clearForm, resetForm } = useForm({
    dateAssigned: todaysDateForForm(),
    title: '',
    description: '',
    link: '',
  });
  const user = useUser() as User;
  const [studentsCallbackIsFor, setStudentsCallbackIsFor] = useState<string[]>(
    [],
  );

  const [createCallback, { loading, error }] = useGqlMutation(
    CREATE_CALLBACK_MUTATION,
  );

  const { data, isLoading } = useGQLQuery(
    'myClassStudents',
    USERS_CLASS_STUDENTS_QUERY,
    {},
    {
      // enabled: !!showForm,
    },
  );
  // console.log(data);
  const createMessage = useCreateMessage();

  const { setCallbackID } = useRecalculateCallback();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Submit the input fields to the backend:
    // console.log(studentsCallbackIsFor);
    if (studentsCallbackIsFor?.length > 0) {
      for (const student of studentsCallbackIsFor) {
        await createCallback({
          ...inputs,
          dateAssigned: new Date(inputs.dateAssigned.concat('T24:00:00.000Z')),
          teacher: user?.id,
          student,
        });
        setCallbackID('new');
        // console.log(res);
        createMessage({
          subject: 'New Callback Assignment',
          message: `you received a new callback item from ${user.name}`,
          receiver: student,
          link: `/callback/new`,
        });
        toast.success(`Created Callback for student`);
      }
      refetch();
      resetForm();
      setStudentsCallbackIsFor([]);
      setShowForm(false);
    } else {
      toast.error('Please select at least one student');
    }
  };
  //   console.log(inputs);
  return (
    <div>
      <GradientButton onClick={() => setShowForm(!showForm)}>
        {showForm
          ? 'Close the form'
          : 'New Callback Assignment For Multiple Students'}
      </GradientButton>

      <FormDialog
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Add a New Callback Assignment"
        size="xl"
      >
        <Form className="w-full max-w-none bg-transparent border-0 shadow-none p-0">
          <DisplayError error={error as any} />
          <fieldset disabled={loading} aria-busy={loading}>
            <div className="form-control w-full mb-4">
              <label className="label">
                <span className="label-text text-white font-semibold">Select Students</span>
              </label>
              <StudentList
                studentList={data?.authenticatedItem}
                selectedStudents={studentsCallbackIsFor}
                setSelectedStudents={setStudentsCallbackIsFor}
              />
            </div>
            <div className="form-control w-full mb-4">
              <label className="label" htmlFor="title">
                <span className="label-text text-white font-semibold">Assignment</span>
              </label>
              <input
                required
                type="text"
                id="title"
                name="title"
                placeholder="Title of Assignment"
                value={inputs.title || ''}
                onChange={handleChange}
                className="input input-bordered w-full bg-base-100 text-base-content border-2 border-base-300 focus:border-[#760D08] focus:ring-2 focus:ring-[rgba(118,13,8,0.3)]"
              />
            </div>
            <div className="form-control w-full mb-4">
              <label className="label" htmlFor="dateAssigned">
                <span className="label-text text-white font-semibold">Due Date</span>
              </label>
              <input
                required
                type="date"
                id="dateAssigned"
                name="dateAssigned"
                value={inputs.dateAssigned}
                onChange={handleChange}
                className="input input-bordered w-full bg-base-100 text-base-content border-2 border-base-300 focus:border-[#760D08] focus:ring-2 focus:ring-[rgba(118,13,8,0.3)]"
              />
            </div>
            <div className="form-control w-full mb-4">
              <label className="label" htmlFor="description">
                <span className="label-text text-white font-semibold">Description</span>
              </label>
              <textarea
                id="description"
                name="description"
                placeholder="Assignment Description"
                required
                value={inputs.description}
                onChange={handleChange}
                rows={5}
                className="textarea textarea-bordered w-full bg-base-100 text-base-content border-2 border-base-300 focus:border-[#760D08] focus:ring-2 focus:ring-[rgba(118,13,8,0.3)] resize-none"
              />
            </div>
            <div className="form-control w-full mb-4">
              <label className="label" htmlFor="link">
                <span className="label-text text-white font-semibold">Link</span>
              </label>
              <input
                id="link"
                name="link"
                placeholder="Link to website"
                value={inputs.link}
                onChange={handleChange}
                className="input input-bordered w-full bg-base-100 text-base-content border-2 border-base-300 focus:border-[#760D08] focus:ring-2 focus:ring-[rgba(118,13,8,0.3)]"
              />
            </div>
            <button 
              type="button" 
              onClick={handleSubmit} 
              className="mt-6 w-full text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:brightness-110 transition-all duration-200 border-none"
              style={{ background: 'linear-gradient(135deg, #760D08, #38B6FF)' }}
            >
              + Publish
            </button>
          </fieldset>
        </Form>
      </FormDialog>
    </div>
  );
}
