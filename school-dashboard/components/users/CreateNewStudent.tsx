import useRevalidatePage from '@/components/../lib/useRevalidatePage';
import DisplayError from '@/components/ErrorMessage';
import GradientButton from '@/components/styles/Button';
import Form, { FormContainerStyles } from '@/components/styles/Form';
import useForm from '@/lib/useForm';
import { useGqlMutation } from '@/lib/useGqlMutation';
import { useGQLQuery } from '@/lib/useGqlQuery';
import gql from 'graphql-tag';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from 'react-query';

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

  const [createNewStudent, { loading, error }] = useGqlMutation(
    CREATE_NEW_STUDENT_MUTATION,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createNewStudent(inputs);
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
      <FormContainerStyles visible={showForm}>
        <div className="bg-gradient-to-tl from-[var(--red)] to-[var(--blue)] border-[5px] border-[var(--tableAccentColor)] rounded-xl shadow-2xl p-6 relative w-full max-w-4xl mx-auto">
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="absolute top-2 right-2 text-white text-2xl font-bold bg-black bg-opacity-40 rounded-full w-10 h-8 flex items-center justify-center hover:bg-opacity-70 focus:outline-none"
            aria-label="Close"
          >
            ×
          </button>
          <Form
            className="w-full bg-transparent border-0 shadow-none p-0"
            onSubmit={handleSubmit}
          >
            <h1 className="text-white font-bold text-xl mb-4">
              Add a New Student
            </h1>
            <DisplayError error={error as any} />
            <fieldset disabled={loading} aria-busy={loading}>
              <div className="mb-4">
                <label
                  htmlFor="name"
                  className="block text-white font-semibold mb-1"
                >
                  Student Name
                </label>
                <input
                  required
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Student Name"
                  value={inputs.name}
                  onChange={handleChange}
                  className="w-full p-2 rounded border"
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="block text-white font-semibold mb-1"
                >
                  Student Email
                </label>
                <input
                  required
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Student Email"
                  value={inputs.email}
                  onChange={handleChange}
                  className="w-full p-2 rounded border"
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="ta"
                  className="block text-white font-semibold mb-1"
                >
                  TA Teacher
                </label>
                <select
                  id="ta"
                  name="ta"
                  value={inputs.ta}
                  onChange={handleChange}
                  required
                  className="w-full p-2 rounded border"
                >
                  <option value="">Select a TA Teacher</option>
                  {data?.teacherList?.map((teacher: any) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((blockNum) => (
                  <div key={blockNum} className="mb-4">
                    <label
                      htmlFor={`block${blockNum}`}
                      className="block text-white font-semibold mb-1"
                    >
                      Block {blockNum} Teacher
                    </label>
                    <select
                      id={`block${blockNum}`}
                      name={`block${blockNum}`}
                      value={inputs[`block${blockNum}` as keyof StudentInputs]}
                      onChange={handleChange}
                      required
                      className="w-full p-2 rounded border"
                    >
                      <option value="">
                        Select a Block {blockNum} Teacher
                      </option>
                      {data?.teacherList?.map((teacher: any) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <button type="submit" className="mt-6">
                + Add A New Student
              </button>
            </fieldset>
          </Form>
        </div>
      </FormContainerStyles>
    </div>
  );
};

export default NewStudent;
