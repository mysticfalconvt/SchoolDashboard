import useForm from '@/lib/useForm';
import { useGqlMutation } from '@/lib/useGqlMutation';
import gql from 'graphql-tag';
import React, { useState } from 'react';
import Error from './ErrorMessage';
import GradientButton from './styles/Button';
import Form from './styles/Form';

interface FormInputs {
  email: string;
}

interface RequestResetData {
  sendUserPasswordResetLink: boolean;
}

interface RequestResetVariables {
  email: string;
}

const REQUEST_RESET_MUTATION = gql`
  mutation REQUEST_RESET_MUTATION($email: String!) {
    sendUserPasswordResetLink(email: $email)
  }
`;

const RequestReset: React.FC = () => {
  const [isSent, setIsSent] = useState(false);
  const { inputs, handleChange, resetForm } = useForm({
    email: '',
  });
  const [signup, { data, loading, error }] = useGqlMutation<
    RequestResetData,
    RequestResetVariables
  >(REQUEST_RESET_MUTATION);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); // stop the form from submitting
    await signup({
      email: inputs.email.toLowerCase(),
    });
    if (data?.sendUserPasswordResetLink) setIsSent(true);
    // resetForm();
    // Send the email and password to the graphqlAPI
  }

  return (
    <Form method="POST" onSubmit={handleSubmit}>
      <h2>Request a Password Reset</h2>
      <Error error={error as any} />
      <fieldset>
        {isSent && <p>Success! Check {inputs.email} for a link!</p>}

        {!isSent && (
          <>
            <label htmlFor="email">
              Email
              <input
                type="email"
                name="email"
                placeholder="Your Email Address"
                autoComplete="email"
                value={inputs.email}
                onChange={handleChange}
                required
              />
            </label>
            <GradientButton
              type="submit"
              disabled={isSent}
              aria-disabled={isSent}
            >
              {isSent ? 'sent' : 'Request Reset!'}
            </GradientButton>
          </>
        )}
      </fieldset>
    </Form>
  );
};

export default RequestReset;
