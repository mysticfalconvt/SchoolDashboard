import { useState } from "react";
import { useMutation } from "@apollo/client";
import gql from "graphql-tag";
import { useRouter } from "next/dist/client/router";
import { useQueryClient } from "react-query";
import GradientButton from "../styles/Button";
import Form, { FormContainer } from "../styles/Form";
import useForm from "../../lib/useForm";
import DisplayError from "../ErrorMessage";
import SearchForUserName from "../SearchForUserName";
import { todaysDateForForm } from "../calendars/formatTodayForForm";

import { useUser } from "../User";
import useCreateMessage from "../Messages/useCreateMessage";
import useSendEmail from "../../lib/useSendEmail";
import { ADMIN_ID } from "../../config";

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

export default function NewBugReportButton() {
  const [showForm, setShowForm] = useState(false);
  const { inputs, handleChange, clearForm, resetForm } = useForm({
    name: "",
    description: "",
  });
  const me = useUser();
  const { sendEmail } = useSendEmail();

  const [createBugReport, { loading, error, data }] = useMutation(
    CREATE_BUG_REPORT_MUTATION,
    {
      variables: {
        name: inputs.name,
        description: inputs.description,
        submittedBy: me?.id,
      },
    }
  );
  const createMessage = useCreateMessage();

  return (
    <div>
      <GradientButton
        onClick={() => setShowForm(!showForm)}
        style={{ display: "block" }}
      >
        {showForm ? "Close the form" : "Bug Report / Feature Request"}
      </GradientButton>
      {showForm && (
        <>
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowForm(false)}
          />

          {/* Modal */}
          <div className="fixed z-50 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-md h-auto rounded-3xl bg-gradient-to-tr from-[var(--red)] to-[var(--blue)] overflow-hidden border-2 border-[var(--blue)] shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-[var(--blue)]">
              <h4 className="text-white text-xl font-semibold">
                Add a New Bug Report
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
                  // Submit the input fields to the backend:
                  // console.log(inputs);
                  const res = await createBugReport();
                  // console.log(res);

                  // Todo: send message when callback assigned
                  createMessage({
                    subject: "New Bug Report",
                    message: `${res?.data?.createBugReport?.submittedBy.name} reported a bug or asked for a feature`,
                    receiver: ADMIN_ID,
                    link: ``,
                  });

                  // Create email to send
                  const email = {
                    toAddress: "rboskind@gmail.com",
                    fromAddress: me.email,
                    subject: `NCUJHS.Tech Bug Report from ${res?.data?.createBugReport?.submittedBy.name}`,
                    body: `
                          <p>This is a bug report from ${res?.data?.createBugReport?.submittedBy.name}. </p>
                          <p>${inputs.name}</p>
                          <p>${inputs.description}</p>
                          `,
                  };

                  //send email to Admin
                  const emailRes = await sendEmail({
                    variables: {
                      emailData: email,
                    },
                  });
                  resetForm();
                  setShowForm(false);
                }}
              >
                <DisplayError error={error} />
                <fieldset disabled={loading} aria-busy={loading}>
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-white font-semibold mb-1">
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
                    <label htmlFor="description" className="block text-white font-semibold mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      placeholder="Describe the bug or feature request"
                      required
                      value={inputs.description}
                      onChange={handleChange}
                      rows="5"
                      className="w-full p-2 rounded border"
                    />
                  </div>
                  <button type="submit" className="mt-6">+ Submit Bug Report</button>
                </fieldset>
              </Form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
