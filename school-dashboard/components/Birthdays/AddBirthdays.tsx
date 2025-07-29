import DisplayError from '@/components/ErrorMessage';
import GradientButton from '@/components/styles/Button';
import Form, { FormContainerStyles } from '@/components/styles/Form';
import useForm from '@/lib/useForm';
import { useGqlMutation } from '@/lib/useGqlMutation';
import gql from 'graphql-tag';
import React, { useState } from 'react';

interface FormInputs {
  userData: string;
  data: string;
}

interface AddBirthdaysData {
  addBirthdays: {
    date: string;
  };
}

interface AddBirthdaysVariables {
  birthdayData: string;
}

const UPDATE_EVENTS_MUTATION = gql`
  mutation UPDATE_EVENTS_MUTATION($birthdayData: String!) {
    addBirthdays(birthdayData: $birthdayData) {
      date
    }
  }
`;

const NewEvents: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const { inputs, handleChange, clearForm } = useForm();
  const [addBirthdaysFromJson, { data, loading, error }] = useGqlMutation<
    AddBirthdaysData,
    AddBirthdaysVariables
  >(UPDATE_EVENTS_MUTATION);
  const [resultOfUpdate, setResultOfUpdate] = useState(null);

  return (
    <div>
      <GradientButton
        style={{ marginTop: '10px' }}
        onClick={() => setShowForm(!showForm)}
      >
        Add Birthdays
      </GradientButton>
      <div>
        <FormContainerStyles>
          <Form
            className={showForm ? 'visible' : 'hidden'}
            onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              // Submit the inputfields to the backend:
              const res = await addBirthdaysFromJson({
                birthdayData: inputs.userData,
              });
              // setResultOfUpdate(
              //   JSON.parse(res.updateStudentSchedules.name)
              // );
              // clearForm();
              setShowForm(false);
            }}
          >
            <h1>Add Birthdays for All Students</h1>
            <DisplayError error={error as any} />
            <fieldset disabled={loading} aria-busy={loading}>
              <label htmlFor="userData">
                Import Birthdays as JSON
                <textarea
                  required
                  rows={25}
                  id="userData"
                  name="userData"
                  placeholder="JSON goes here"
                  value={inputs.data}
                  onChange={handleChange}
                />
              </label>

              <button type="submit">update Data</button>
            </fieldset>
          </Form>
        </FormContainerStyles>
        {/* {resultOfUpdate && (
          <div>
            {resultOfUpdate.map((user) => {
              return (
                <p key={user.id}>
                  {user.email} - {user.existed ? 'Existing User' : 'New User'}
                </p>
              );
            })}
          </div>
        )} */}
      </div>
    </div>
  );
};

export default NewEvents;
