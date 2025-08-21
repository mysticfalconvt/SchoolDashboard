import { useGqlMutation } from '@/lib/useGqlMutation';
import gql from 'graphql-tag';
import React, { useState } from 'react';
import { ADMIN_ID } from '../../config';
import useForm from '../../lib/useForm';
import useSendEmail from '../../lib/useSendEmail';
import DisplayError from '../ErrorMessage';
import useCreateMessage from '../Messages/useCreateMessage';
import GradientButton from '../styles/Button';
import { FormDialog } from '../styles/Dialog';
import Form from '../styles/Form';
import { useUser } from '../User';

interface FormInputs {
  name: string;
  description: string;
}

interface BugReportData {
  createBugReport: {
    id: string;
    submittedBy: {
      id: string;
      name: string;
    };
  };
}

interface BugReportVariables {
  name: string;
  description: string;
  submittedBy: string;
}

interface EmailData {
  toAddress: string;
  fromAddress: string;
  subject: string;
  body: string;
}

export const CREATE_BUG_REPORT_MUTATION = gql`
  mutation CREATE_BUG_REPORT_MUTATION(
    $name: String!
    $submittedBy: ID!
    $description: String!
  ) {
    createBugReport(
      data: {
        name: $name
        submittedBy: { connect: { id: $submittedBy } }
        description: $description
      }
    ) {
      id
      submittedBy {
        id
        name
      }
    }
  }
`;

const NewBugReportButton: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const { inputs, handleChange, clearForm, resetForm } = useForm({
    name: '',
    description: '',
  });
  const me = useUser();
  const { sendEmail } = useSendEmail();

  const [createBugReport, { data, loading, error }] = useGqlMutation<
    BugReportData,
    BugReportVariables
  >(CREATE_BUG_REPORT_MUTATION);
  const createMessage = useCreateMessage();

  return (
    <div>
      <GradientButton
        onClick={() => setShowForm(!showForm)}
        style={{ display: 'block' }}
      >
        {showForm ? 'Close the form' : 'Bug Report / Feature Request'}
      </GradientButton>
      <FormDialog
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Add a New Bug Report"
        size="md"
      >
        <Form
          className="w-full bg-transparent border-0 shadow-none p-0"
          onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            // Submit the input fields to the backend:
            // console.log(inputs);
            try {
              await createBugReport({
                name: inputs.name,
                description: inputs.description,
                submittedBy: me?.id || '',
              });

              createMessage({
                subject: 'New Bug Report',
                message: `${me?.name} reported a bug or asked for a feature`,
                receiver: ADMIN_ID,
                link: ``,
              });

              // Create email to send
              const email: EmailData = {
                toAddress: 'rboskind@gmail.com',
                fromAddress: me?.email || '',
                subject: `NCUJHS.Tech Bug Report from ${me?.name}`,
                body: `
                      <p>This is a bug report from ${me?.name}. </p>
                      <p>${inputs.name}</p>
                      <p>${inputs.description}</p>
                      `,
              };

              //send email to Admin
              const emailRes = await sendEmail({
                emailData: email,
              });
              resetForm();
              setShowForm(false);
            } catch (error) {
              console.error('Error creating bug report:', error);
            }
          }}
        >
          <DisplayError error={error as any} />
          <fieldset disabled={loading} aria-busy={loading}>
            <div className="mb-4">
              <label
                htmlFor="name"
                className="block text-white font-semibold mb-1"
              >
                Subject
              </label>
              <input
                required
                type="text"
                id="name"
                name="name"
                placeholder="Bug Report Subject"
                value={inputs.name}
                onChange={handleChange}
                className="w-full p-2 rounded border"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="description"
                className="block text-white font-semibold mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                placeholder="Describe the bug or feature request"
                required
                value={inputs.description}
                onChange={handleChange}
                rows={5}
                className="w-full p-2 rounded border"
              />
            </div>
            <button type="submit" className="mt-6">
              + Submit Bug Report
            </button>
          </fieldset>
        </Form>
      </FormDialog>
    </div>
  );
};

export default NewBugReportButton;
