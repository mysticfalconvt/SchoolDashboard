import { useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from 'react-query';
import useForm from '../../lib/useForm';
import { useGQLQuery } from '../../lib/useGqlQuery';
import useRevalidatePage from '../../lib/useRevalidatePage';
import DisplayError from '../ErrorMessage';
import GradientButton from '../styles/Button';
import Form, { FormContainerStyles } from '../styles/Form';

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

interface NewStudentProps {
  student?: any;
}

interface StudentInputs {
  name: string;
  email: string;
  ta: string;
  block1: string;
  block2: string;
  block3: string;
  block4: string;
  block5: string;
  block6: string;
  block7: string;
  block8: string;
  block9: string;
  block10: string;
}

const NewStudent: React.FC<NewStudentProps> = ({ student }) => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const revalidateIndexPage = useRevalidatePage('/');
  const { data, isLoading } = useGQLQuery(
    `ListOfTeachers`,
    LIST_OF_TEACHERS_QUERY,
    {},
    { enabled: showForm },
  );
  const { inputs, handleChange, clearForm, resetForm } = useForm({
    name: '',
    email: '',
    ta: '',
    block1: '',
    block2: '',
    block3: '',
    block4: '',
    block5: '',
    block6: '',
    block7: '',
    block8: '',
    block9: '',
    block10: '',
  });

  const [createNewStudent, { loading, error }] = useMutation(
    CREATE_NEW_STUDENT_MUTATION,
    {
      variables: inputs,
    },
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createNewStudent();
      toast.success('Student created successfully!');
      resetForm();
      setShowForm(false);
      revalidateIndexPage();
    } catch (err) {
      toast.error('Error creating student');
    }
  };

  return (
    <div>
      <GradientButton
        onClick={() => setShowForm(!showForm)}
        style={{ marginLeft: '100px' }}
      >
        {showForm ? 'Close the form' : 'Add A New Student'}
      </GradientButton>
      <FormContainerStyles>
        <Form
          className={showForm ? 'visible' : 'hidden'}
          onSubmit={handleSubmit}
        >
          <h1>Add a New Student</h1>
          <DisplayError error={error as any} />
          <fieldset disabled={loading} aria-busy={loading}>
            <label htmlFor="name">
              Student Name
              <input
                required
                type="text"
                id="name"
                name="name"
                placeholder="Student Name"
                value={inputs.name}
                onChange={handleChange}
              />
            </label>

            <label htmlFor="email">
              Student Email
              <input
                required
                type="email"
                id="email"
                name="email"
                placeholder="Student Email"
                value={inputs.email}
                onChange={handleChange}
              />
            </label>

            <label htmlFor="ta">
              TA Teacher
              <select
                id="ta"
                name="ta"
                value={inputs.ta}
                onChange={handleChange}
                required
              >
                <option value="">Select a TA Teacher</option>
                {data?.teacherList?.map((teacher: any) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </label>

            <label htmlFor="block1">
              Block 1 Teacher
              <select
                id="block1"
                name="block1"
                value={inputs.block1}
                onChange={handleChange}
                required
              >
                <option value="">Select a Block 1 Teacher</option>
                {data?.teacherList?.map((teacher: any) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </label>

            <label htmlFor="block2">
              Block 2 Teacher
              <select
                id="block2"
                name="block2"
                value={inputs.block2}
                onChange={handleChange}
                required
              >
                <option value="">Select a Block 2 Teacher</option>
                {data?.teacherList?.map((teacher: any) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </label>

            <label htmlFor="block3">
              Block 3 Teacher
              <select
                id="block3"
                name="block3"
                value={inputs.block3}
                onChange={handleChange}
                required
              >
                <option value="">Select a Block 3 Teacher</option>
                {data?.teacherList?.map((teacher: any) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </label>

            <label htmlFor="block4">
              Block 4 Teacher
              <select
                id="block4"
                name="block4"
                value={inputs.block4}
                onChange={handleChange}
                required
              >
                <option value="">Select a Block 4 Teacher</option>
                {data?.teacherList?.map((teacher: any) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </label>

            <label htmlFor="block5">
              Block 5 Teacher
              <select
                id="block5"
                name="block5"
                value={inputs.block5}
                onChange={handleChange}
                required
              >
                <option value="">Select a Block 5 Teacher</option>
                {data?.teacherList?.map((teacher: any) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </label>

            <label htmlFor="block6">
              Block 6 Teacher
              <select
                id="block6"
                name="block6"
                value={inputs.block6}
                onChange={handleChange}
                required
              >
                <option value="">Select a Block 6 Teacher</option>
                {data?.teacherList?.map((teacher: any) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </label>

            <label htmlFor="block7">
              Block 7 Teacher
              <select
                id="block7"
                name="block7"
                value={inputs.block7}
                onChange={handleChange}
                required
              >
                <option value="">Select a Block 7 Teacher</option>
                {data?.teacherList?.map((teacher: any) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </label>

            <label htmlFor="block8">
              Block 8 Teacher
              <select
                id="block8"
                name="block8"
                value={inputs.block8}
                onChange={handleChange}
                required
              >
                <option value="">Select a Block 8 Teacher</option>
                {data?.teacherList?.map((teacher: any) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </label>

            <label htmlFor="block9">
              Block 9 Teacher
              <select
                id="block9"
                name="block9"
                value={inputs.block9}
                onChange={handleChange}
                required
              >
                <option value="">Select a Block 9 Teacher</option>
                {data?.teacherList?.map((teacher: any) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </label>

            <label htmlFor="block10">
              Block 10 Teacher
              <select
                id="block10"
                name="block10"
                value={inputs.block10}
                onChange={handleChange}
                required
              >
                <option value="">Select a Block 10 Teacher</option>
                {data?.teacherList?.map((teacher: any) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </label>

            <button type="submit">+ Add A New Student</button>
          </fieldset>
        </Form>
      </FormContainerStyles>
    </div>
  );
};

export default NewStudent;
