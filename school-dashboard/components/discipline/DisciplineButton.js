import { useState } from "react";
import { useMutation } from "@apollo/client";
import gql from "graphql-tag";
import { useQueryClient } from "react-query";
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
import useRevalidatePage from "../../lib/useRevalidatePage";
import toast from "react-hot-toast";

const GET_ADMIN_EMAILS = gql`
  query GET_ADMIN_EMAILS {
    users(where: { canManageDiscipline: { equals: true } }) {
      id
      name
      email
    }
  }
`;

const CREATE_DISCIPLINE_MUTATION = gql`
  mutation CREATE_DISCIPLINE_MUTATION(
    $teacherComments: String!
    $date: DateTime
    $teacher: ID!
    $student: ID!
    $classType: String!
    $location: String!
    $timeOfDay: String!
    $inappropriateLanguage: Boolean
    $physicalConduct: Boolean
    $nonCompliance: Boolean
    $disruption: Boolean
    $propertyMisuse: Boolean
    $otherConduct: Boolean
    $VerbalWarning: Boolean
    $buddyRoom: Boolean
    $conferenceWithStudent: Boolean
    $ParentContact: Boolean
    $PlanningRoomReferral: Boolean
    $FollowupPlan: Boolean
    $LossOfPrivilege: Boolean
    $DetentionWithTeacher: Boolean
    $IndividualizedInstruction: Boolean
    $GuidanceReferral: Boolean
    $ReferToAdministrator: Boolean
    $OtherAction: Boolean
    $none: Boolean
    $peers: Boolean
    $teacherInvolved: Boolean
    $substitute: Boolean
    $unknown: Boolean
    $othersInvolved: Boolean
  ) {
    createDiscipline(
      data: {
        teacherComments: $teacherComments
        date: $date
        teacher: { connect: { id: $teacher } }
        student: { connect: { id: $student } }
        classType: $classType
        location: $location
        timeOfDay: $timeOfDay
        inappropriateLanguage: $inappropriateLanguage
        physicalConduct: $physicalConduct
        nonCompliance: $nonCompliance
        disruption: $disruption
        propertyMisuse: $propertyMisuse
        otherConduct: $otherConduct
        VerbalWarning: $VerbalWarning
        buddyRoom: $buddyRoom
        conferenceWithStudent: $conferenceWithStudent
        ParentContact: $ParentContact
        PlanningRoomReferral: $PlanningRoomReferral
        FollowupPlan: $FollowupPlan
        LossOfPrivilege: $LossOfPrivilege
        DetentionWithTeacher: $DetentionWithTeacher
        IndividualizedInstruction: $IndividualizedInstruction
        GuidanceReferral: $GuidanceReferral
        ReferToAdministrator: $ReferToAdministrator
        OtherAction: $OtherAction
        none: $none
        peers: $peers
        teacherInvolved: $teacherInvolved
        substitute: $substitute
        unknown: $unknown
        othersInvolved: $othersInvolved
      }
    ) {
      id
      student {
        name
      }
    }
  }
`;

export default function NewDiscipline({ refetch }) {
  const revalidatePage = useRevalidatePage("/discipline");
  const me = useUser();
  const queryClient = useQueryClient();
  const { data, isLoading } = useGQLQuery(`AdminEmails`, GET_ADMIN_EMAILS);
  const adminEmailArray = data?.users?.map((u) => u.email);
  const [showForm, setShowForm] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const { inputs, handleChange, clearForm, resetForm } = useForm({
    date: todaysDateForForm(),
    teacherComments: "",
  });
  const user = useUser();
  const [studentReferralIsFor, setStudentReferralIsFor] = useState(null);
  const [classType, setClassType] = useState("");
  const [location, setLocation] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("");

  const { sendEmail, emailLoading } = useSendEmail();
  //   console.log(`user ${user.id}`);
  const [createDiscipline, { loading, error }] = useMutation(
    CREATE_DISCIPLINE_MUTATION,
    {
      variables: {
        ...inputs,
        teacher: user?.id,
        student: studentReferralIsFor?.userId,
        classType,
        location,
        timeOfDay,
        date: new Date(inputs.date),
      },
    }
  );
  const isDevelopment = process.env.NODE_ENV === "development";
  return (
    <div>
      <GradientButton
        onClick={() => setShowForm(!showForm)}
        style={{ marginLeft: "100px" }}
      >
        {showForm ? "Close the form" : "New Discipline Referral"}
      </GradientButton>
      <FormContainerStyles>
        <Form
          className={showForm ? "visible" : "hidden"}
          // hidden={!showForm}
          onSubmit={async (e) => {
            e.preventDefault();
            // Submit the input fields to the backend:
            const res = await createDiscipline();
            setEmailSending(true);
            if (res.data.createDiscipline.id && adminEmailArray) {
              // loop over each email in adminEmailArray and send an email to each one async and await
              for (const email of adminEmailArray) {
                const emailToSend = {
                  toAddress: email,
                  fromAddress: me.email,
                  subject: `New Discipline Referral for ${res.data.createDiscipline.student.name}`,
                  body: `
              <p>There is a new Discipline Referral for ${res.data.createDiscipline.student.name} at NCUJHS.TECH created by ${me.name}. </p>
              <p><a href="https://ncujhs.tech/discipline/${res.data.createDiscipline.id}">Click Here to View</a></p>
               `,
                };
                // console.log(emailToSend);

                const emailRes = await sendEmail({
                  variables: {
                    emailData: emailToSend,
                  },
                });
                console.log(emailRes);
              }
            }
            resetForm();
            refetch();
            setEmailSending(false);
            const revalidateResponse = revalidatePage();
            if (res) {
              toast.success("Discipline Referral Created");
            }
            queryClient.refetchQueries("allDisciplines");
            setStudentReferralIsFor(null);
            setShowForm(false);
          }}
        >
          <h2>Add a New Referral</h2>
          <DisplayError error={error} />
          <fieldset
            disabled={loading || emailSending}
            aria-busy={loading || emailSending}
          >
            <FormGroupStyles>
              <div>
                <label htmlFor="studentName">Student Name</label>
                <SearchForUserName
                  name="studentName"
                  userType="isStudent"
                  // value={inputs.studentName}
                  updateUser={setStudentReferralIsFor}
                />
              </div>

              <label htmlFor="date">
                Date of Event
                <input
                  required
                  type="date"
                  id="date"
                  name="date"
                  value={inputs.date}
                  onChange={handleChange}
                />
              </label>
            </FormGroupStyles>
            <FormGroupStyles>
              <FormSelect
                currentValue={classType}
                setValue={setClassType}
                name="Class Type"
                listOfOptions={classTypeList}
                required
              />
              <FormSelect
                currentValue={location}
                setValue={setLocation}
                name="location"
                listOfOptions={locationList}
                required
              />

              <FormSelect
                currentValue={timeOfDay}
                setValue={setTimeOfDay}
                name="Time of Day"
                required
                listOfOptions={timeOfDayList}
              />
            </FormGroupStyles>
            <FormGroupStyles>
              <FormCheckboxArray
                inputs={inputs}
                handleChange={handleChange}
                name="Inappropriate Student Conduct"
                listOfCheckBoxes={studentConductList}
              />
              <FormCheckboxArray
                inputs={inputs}
                handleChange={handleChange}
                name="Teacher Actions"
                listOfCheckBoxes={teacherActionList}
              />
              <FormCheckboxArray
                inputs={inputs}
                handleChange={handleChange}
                name="Others Involved"
                listOfCheckBoxes={othersInvolvedList}
              />
            </FormGroupStyles>
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
