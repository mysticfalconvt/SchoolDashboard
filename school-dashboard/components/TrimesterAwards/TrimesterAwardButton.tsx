import { useGqlMutation } from '@/lib/useGqlMutation';
import gql from 'graphql-tag';
import { useState } from 'react';
import useForm from '../../lib/useForm';
import DisplayError from '../ErrorMessage';
import GradientButton from '../styles/Button';
import Form, { FormContainer } from '../styles/Form';
import { useUser } from '../User';

const ADD_AWARD_MUTATION = gql`
  mutation ADD_AWARD_MUTATION(
    $howl: String!
    $student: ID!
    $teacher: ID!
    $trimester: String!
  ) {
    createTrimesterAward(
      data: {
        howl: $howl
        trimester: $trimester
        teacher: { connect: { id: $teacher } }
        student: { connect: { id: $student } }
      }
    ) {
      id
    }
  }
`;

interface Student {
  id: string;
  name: string;
}

interface User {
  id: string;
}

interface FormInputs {
  howl: string;
  trimester: string;
}

interface TrimesterAwardButtonProps {
  student: Student;
  trimester: string;
  refetch: () => void;
}

export default function TrimesterAwardButton({
  student,
  trimester,
  refetch,
}: TrimesterAwardButtonProps) {
  const [showForm, setShowForm] = useState(false);

  const { inputs, handleChange, clearForm, resetForm } = useForm({
    howl: '',
    trimester,
  });
  const me = useUser() as User;

  const teacher = me?.id;

  // console.log(studentCardIsFor);

  const [createTrimesterAward, { data, loading, error }] = useGqlMutation(ADD_AWARD_MUTATION);
  return (
    <div>
      <GradientButton
        style={{ margin: '5px' }}
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? 'close' : 'Trimester Award'}
      </GradientButton>
      <FormContainer visible={showForm}>
        <Form
          className={showForm ? 'visible' : 'hidden'}
          style={{ width: '500px' }}
          onSubmit={async (e) => {
            e.preventDefault();
            // Submit the input fields to the backend:
            // console.log(inputs);
            createTrimesterAward({
              teacher,
              student: student.id,
              howl: inputs.howl,
              trimester: trimester.toString(),
            });
            resetForm();
            await refetch();
            setShowForm(false);
            // console.log(inputs);
          }}
        >
          <DisplayError error={error as any} />
          <h2>Trimester Award for {student.name}</h2>
          <fieldset disabled={loading} aria-busy={loading}>
            {/* <FormGroup> */}
            <label htmlFor="howl">
              H.O.W.L.
              <select
                required
                id="howl"
                name="howl"
                value={inputs.howl || ''}
                onChange={handleChange}
                className="select select-bordered w-full bg-base-100 text-base-content border-2 border-base-300 focus:border-[#760D08] focus:ring-2 focus:ring-[rgba(118,13,8,0.3)]"
              >
                <option value="">Select H.O.W.L.</option>
                <option value="Respect">Respect</option>
                <option value="Responsibility">Responsibility</option>
                <option value="Perseverance">Perseverance</option>
              </select>
            </label>
            {/* </FormGroup> */}

            <button type="submit">+ Submit</button>
          </fieldset>
        </Form>
      </FormContainer>
    </div>
  );
}
