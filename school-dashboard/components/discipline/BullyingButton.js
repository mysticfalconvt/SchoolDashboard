import { useState } from "react";
import { useMutation } from "@apollo/client";
import gql from "graphql-tag";
import GradientButton from "../styles/Button";
import Form, { FormContainerStyles, FormGroupStyles } from "../styles/Form";
import useForm from "../../lib/useForm";
import DisplayError from "../ErrorMessage";
import { useUser } from "../User";
import SearchForUserName from "../SearchForUserName";
import FormSelect from "../../lib/FormSelect";
import {
  classTypeList,
  locationList,
  othersInvolvedList,
  studentConductList,
  teacherActionList,
  timeOfDayList,
} from "../../lib/disciplineData";
import FormCheckboxArray from "../../lib/FormCheckboxArray";
import { todaysDateForForm } from "../calendars/formatTodayForForm";
import useSendEmail from "../../lib/useSendEmail";
import { useGQLQuery } from "../../lib/useGqlQuery";

const GET_ADMIN_EMAILS = gql`
  query GET_ADMIN_EMAILS {
    users(where: { canManageDiscipline: { equals: true } }) {
      id
      name
      email
    }
  }
`;

const CREATE_HHB_MUTATION = gql`
  mutation CREATE_HHB_MUTATION(
    $teacher: ID!
    $student: ID!
    $dateOfEvent: DateTime
    $dateReported: DateTime
    $studentReporter: String
    $employeeWitness: String
    $studentWitness: String
    $initialActions: String
    $nextSteps: String
    $teacherComments: String
  ) {
    createBullying(
      data: {
        teacherAuthor: { connect: { id: $teacher } }
        studentOffender: { connect: { id: $student } }
        dateOfEvent: $dateOfEvent
        dateReported: $dateReported
        studentReporter: $studentReporter
        employeeWitness: $employeeWitness
        studentWitness: $studentWitness
        initialActions: $initialActions
        nextSteps: $nextSteps
        description: $teacherComments
      }
    ) {
      id
      studentOffender {
        id
        name
      }
    }
  }
`;

export default function NewBullying({ refetch }) {
  const me = useUser();
  const { data, isLoading } = useGQLQuery(`AdminEmails`, GET_ADMIN_EMAILS);
  const adminEmailArray = data?.users?.map((u) => u.email);
  const [showForm, setShowForm] = useState(false);
  const { inputs, handleChange, clearForm, resetForm } = useForm({
    dateReported: todaysDateForForm(),
    dateOfEvent: todaysDateForForm(),
    studentReporter: "",
    employeeWitness: "",
    studentWitness: "",
    initialActions: "",
    nextSteps: "",
    teacherComments: "",
  });
  const user = useUser();
  const [studentReferralIsFor, setStudentReferralIsFor] = useState(null);
  const { sendEmail, emailLoading } = useSendEmail();

  const [createHHB, { loading, error }] = useMutation(CREATE_HHB_MUTATION, {
    variables: {
      ...inputs,
      teacher: user?.id,
      student: studentReferralIsFor?.userId,
      dateReported: new Date(inputs.dateReported).toISOString(),
      dateOfEvent: new Date(inputs.dateOfEvent).toISOString(),
    },
  });
  return (
    <div>
      <GradientButton
        onClick={() => setShowForm(!showForm)}
        style={{ marginLeft: "100px" }}
      >
        {showForm ? "Close the form" : "New HHB Referral"}
      </GradientButton>
      <FormContainerStyles>
        <Form
          className={showForm ? "visible" : "hidden"}
          // hidden={!showForm}
          onSubmit={async (e) => {
            e.preventDefault();
            // Submit the input fields to the backend:
            const res = await createHHB();
            if (res.data.createBullying.id) {
              // loop over each email in adminEmailArray and send an email to each one async and await
              for (const email of adminEmailArray) {
                const emailToSend = {
                  toAddress: email,
                  fromAddress: me.email,
                  subject: `New HHB Referral for ${res.data.createBullying.studentOffender.name}`,
                  body: `
                <p>There is a new HHB Referral for ${res.data.createBullying.studentOffender.name} at NCUJHS.TECH created by ${me.name}. </p>
                <p><a href="https://ncujhs.tech/hhb/${res.data.createBullying.id}">Click Here to View</a></p>
                 `,
                };
                const emailRes = await sendEmail({
                  variables: {
                    emailData: emailToSend,
                  },
                });
              }
            }

            resetForm();
            refetch();
            setShowForm(false);
          }}
        >
          <h2>Add a New HHB Referral</h2>
          <DisplayError error={error} />
          <fieldset disabled={loading} aria-busy={loading}>
            <FormGroupStyles>
              <div>
                <label htmlFor="studentName">
                  Identity of alleged student offender
                </label>
                <SearchForUserName
                  name="studentName"
                  userType="isStudent"
                  // value={inputs.studentName}
                  updateUser={setStudentReferralIsFor}
                />
              </div>

              <label htmlFor="dateReported">
                Date of Report
                <input
                  required
                  type="date"
                  id="dateReported"
                  name="dateReported"
                  value={inputs.dateReported}
                  onChange={handleChange}
                />
              </label>
              <label htmlFor="dateOfEvent">
                Date of Event
                <input
                  required
                  type="date"
                  id="dateOfEvent"
                  name="dateOfEvent"
                  value={inputs.dateOfEvent}
                  onChange={handleChange}
                />
              </label>
            </FormGroupStyles>

            <label htmlFor="studentReporter">
              Student Reporter
              <input
                type="text"
                id="studentReporter"
                name="studentReporter"
                value={inputs.studentReporter}
                onChange={handleChange}
              />
            </label>
            <label htmlFor="employeeWitness">
              Employee Witnesses
              <input
                type="text"
                id="employeeWitness"
                name="employeeWitness"
                value={inputs.employeeWitness}
                onChange={handleChange}
              />
            </label>
            <label htmlFor="studentWitness">
              Student Witness
              <input
                type="text"
                id="studentWitness"
                name="studentWitness"
                value={inputs.studentWitness}
                onChange={handleChange}
              />
            </label>
            <label htmlFor="initialActions">
              Initial Actions taken by author if witnessed
              <input
                type="text"
                id="initialActions"
                name="initialActions"
                value={inputs.initialActions}
                onChange={handleChange}
              />
            </label>
            <label htmlFor="nextSteps">
              Next Steps to be taken
              <input
                type="text"
                id="nextSteps"
                name="nextSteps"
                value={inputs.nextSteps}
                onChange={handleChange}
              />
            </label>

            <label htmlFor="description">
              Description
              <textarea
                id="teacherComments"
                name="teacherComments"
                placeholder="Teacher's Comments"
                required
                value={inputs.teacherComments}
                onChange={handleChange}
                rows="5"
              />
            </label>

            <button type="submit">+ Publish</button>
          </fieldset>
        </Form>
      </FormContainerStyles>
    </div>
  );
}
