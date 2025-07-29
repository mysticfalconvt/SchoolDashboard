import { NUMBER_OF_BLOCKS } from '@/components/../config';
import DisplayError from '@/components/ErrorMessage';
import GradientButton from '@/components/styles/Button';
import Form from '@/components/styles/Form';
import useForm from '@/lib/useForm';
import { useGqlMutation } from '@/lib/useGqlMutation';
import { useGQLQuery } from '@/lib/useGqlQuery';
import gql from 'graphql-tag';
import { useState } from 'react';
import { useQueryClient } from 'react-query';

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

interface Teacher {
  id: string;
  name: string;
}

interface Student {
  id: string;
  name: string;
  taTeacher?: {
    id: string;
  };
  [key: string]: any; // For dynamic block properties
}

interface FormInputs {
  name: string;
  ta?: string;
  [key: string]: any; // For dynamic block properties
}

interface EditStudentProps {
  student: Student;
}

// Generate the dynamic mutation string
const generateMutation = (numberOfBlocks: number) => {
  const blockInputs = Array.from(
    { length: numberOfBlocks },
    (_, i) => `$block${i + 1}: ID`,
  ).join(' ');
  const blockData = Array.from(
    { length: numberOfBlocks },
    (_, i) => `block${i + 1}Teacher: { connect: { id: $block${i + 1} } }`,
  ).join(' ');

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

export default function EditStudent({ student }: EditStudentProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, error } = useGQLQuery(
    `ListOfTeachers`,
    LIST_OF_TEACHERS_QUERY,
    {},
    { enabled: showForm },
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

  const [updateStudent, { loading }] = useGqlMutation(mutation);

  const teacherListRaw = data?.teacherList || [];
  const teacherList = teacherListRaw.sort((a: Teacher, b: Teacher) =>
    a.name.localeCompare(b.name),
  );

  return (
    <div>
      <GradientButton onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Close' : 'Edit Student'}
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
                Edit {student.name}'s Schedule
              </h4>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="w-8 h-8 text-white bg-[var(--redTrans)] hover:bg-[var(--blue)] rounded-full flex items-center justify-center text-lg font-bold transition-colors duration-200"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <Form
                className="w-full bg-transparent border-0 shadow-none p-0"
                onSubmit={async (e) => {
                  e.preventDefault();
                  await updateStudent({
                    ...inputs,
                    id: student.id,
                  });
                  queryClient.refetchQueries();
                  setShowForm(false);
                }}
              >
                <DisplayError error={error as any} />
                <fieldset disabled={loading} aria-busy={loading}>
                  <div className="mb-4">
                    <label
                      htmlFor="name"
                      className="block text-white font-semibold mb-1"
                    >
                      Name
                    </label>
                    <input
                      required
                      type="text"
                      id="name"
                      name="name"
                      value={inputs.name || ''}
                      onChange={handleChange}
                      className="w-full p-2 rounded border bg-white text-gray-900"
                    />
                  </div>
                  <div className="mb-4">
                    <label
                      htmlFor="ta"
                      className="block text-white font-semibold mb-1"
                    >
                      TA
                    </label>
                    <select
                      id="ta"
                      name="ta"
                      value={inputs.ta}
                      onChange={handleChange}
                      className="w-full p-2 rounded border bg-white text-gray-900"
                    >
                      {teacherList.map((item: Teacher) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {Array.from({ length: NUMBER_OF_BLOCKS }, (_, i) => (
                    <div key={`block${i + 1}`} className="mb-4">
                      <label
                        htmlFor={`block${i + 1}`}
                        className="block text-white font-semibold mb-1"
                      >
                        Block {i + 1}
                      </label>
                      <select
                        id={`block${i + 1}`}
                        name={`block${i + 1}`}
                        value={inputs[`block${i + 1}`]}
                        onChange={handleChange}
                        className="w-full p-2 rounded border bg-white text-gray-900"
                      >
                        {teacherList.map((item: Teacher) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-6">
                    <button type="submit" className="flex-1">
                      + Publish
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1"
                    >
                      Undo
                    </button>
                  </div>
                </fieldset>
              </Form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
