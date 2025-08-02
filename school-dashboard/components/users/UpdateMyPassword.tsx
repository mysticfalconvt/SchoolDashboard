import DisplayError from '@/components/ErrorMessage';
import GradientButton from '@/components/styles/Button';
import Form, { FormContainer } from '@/components/styles/Form';
import { useUser } from '@/components/User';
import useForm from '@/lib/useForm';
import { useGqlMutation } from '@/lib/useGqlMutation';
import gql from 'graphql-tag';
import React from 'react';

const RESET_PASSWORD_TO_PASSWORD_MUTATION = gql`
  mutation RESET_PASSWORD_TO_PASSWORD_MUTATION($id: ID!, $password: String!) {
    updateUser(where: { id: $id }, data: { password: $password }) {
      id
    }
  }
`;

interface FormInputs {
  newPassword: string;
}

interface User {
  id: string;
}

export default function UpdateMyPassword() {
  const me = useUser() as User;
  const [showForm, setShowForm] = React.useState(false);
  const { inputs, handleChange, resetForm } = useForm({ newPassword: '' });
  const [resetThePassword, { loading, error, data }] = useGqlMutation(
    RESET_PASSWORD_TO_PASSWORD_MUTATION,
  );

  return (
    <div>
      <GradientButton style={{}} onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Hide  Update  Password  ' : 'Update My Password'}
      </GradientButton>
      <div style={{ position: 'relative', marginTop: '-320px' }}>
        <FormContainer visible={showForm}>
          <Form
            className={showForm ? 'visible moveUp' : 'hidden'}
            onSubmit={async (e) => {
              e.preventDefault();
              // Submit the inputfields to the backend:
              await resetThePassword({
                id: me?.id,
                password: inputs.newPassword,
              });
              resetForm();
              setShowForm(false);
            }}
          >
            <h1>Update My Password</h1>
            <DisplayError error={error as any} />
            <fieldset disabled={loading} aria-busy={loading}>
              <label htmlFor="newPassword">
                New Password
                <input
                  required
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  placeholder="Your New Password"
                  value={inputs.newPassword}
                  onChange={handleChange}
                />
              </label>

              <button type="submit">update Data</button>
            </fieldset>
          </Form>
        </FormContainer>
      </div>
    </div>
  );
}
