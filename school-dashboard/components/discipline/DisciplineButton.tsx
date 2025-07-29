import {
  classTypeList,
  locationList,
  othersInvolvedList,
  studentConductList,
  teacherActionList,
  timeOfDayList,
} from '@/components/../lib/disciplineData';
import FormCheckboxArray from '@/components/../lib/FormCheckboxArray';
import FormSelect from '@/components/../lib/FormSelect';
import useRevalidatePage from '@/components/../lib/useRevalidatePage';
import useSendEmail from '@/components/../lib/useSendEmail';
import { todaysDateForForm } from '@/components/calendars/formatTodayForForm';
import DisplayError from '@/components/ErrorMessage';
import SearchForUserName from '@/components/SearchForUserName';
import GradientButton from '@/components/styles/Button';
import Form, {
  FormContainerStyles,
  FormGroupStyles,
} from '@/components/styles/Form';
import { useUser } from '@/components/User';
import useForm from '@/lib/useForm';
import { useGqlMutation } from '@/lib/useGqlMutation';
import { useGQLQuery } from '@/lib/useGqlQuery';
import gql from 'graphql-tag';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from 'react-query';

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

interface DisciplineInputs {
  date: string;
  teacherComments: string;
}

interface StudentReferral {
  userId: string;
  userName: string;
}

interface NewDisciplineProps {
  refetch: () => void;
}

const NewDiscipline: React.FC<NewDisciplineProps> = ({ refetch }) => {
  const revalidatePage = useRevalidatePage('/discipline');
  const me = useUser();
  const queryClient = useQueryClient();
  const { data, isLoading } = useGQLQuery(`AdminEmails`, GET_ADMIN_EMAILS);
  const adminEmailArray = data?.users?.map((u: any) => u.email);
  const [showForm, setShowForm] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const { inputs, handleChange, clearForm, resetForm } = useForm({
    date: todaysDateForForm(),
    teacherComments: '',
  });
  const user = useUser();
  const [studentReferralIsFor, setStudentReferralIsFor] =
    useState<StudentReferral | null>(null);
  const [classType, setClassType] = useState('');
  const [location, setLocation] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('');

  const { sendEmail, emailLoading } = useSendEmail();
  //   console.log(`user ${user.id}`);
  const [createDiscipline, { loading, error }] = useGqlMutation(
    CREATE_DISCIPLINE_MUTATION,
  );
  const isDevelopment = process.env.NODE_ENV === 'development';
  return (
    <div>
      <GradientButton
        onClick={() => setShowForm(!showForm)}
        style={{ marginLeft: '100px' }}
      >
        {showForm ? 'Close the form' : 'New Discipline Referral'}
      </GradientButton>
      <FormContainerStyles>
        <Form
          className={showForm ? 'visible' : 'hidden'}
          // hidden={!showForm}
          onSubmit={async (e) => {
            e.preventDefault();
            // Submit the input fields to the backend:
            await createDiscipline({
              ...inputs,
              teacher: user?.id,
              student: studentReferralIsFor?.userId,
              classType,
              location,
              timeOfDay,
              date: new Date(inputs.date),
            });
            setEmailSending(true);
            if (adminEmailArray) {
              // loop over each email in adminEmailArray and send an email to each one async and await
              for (const email of adminEmailArray) {
                const emailToSend = {
                  toAddress: email,
                  fromAddress: me.email,
                  subject: `New Discipline Referral for ${studentReferralIsFor?.userName}`,
                  body: `
              <p>There is a new Discipline Referral for ${studentReferralIsFor?.userName} at NCUJHS.TECH created by ${me.name}. </p>
              <p><a href="https://ncujhs.tech/discipline/new">Click Here to View</a></p>
               `,
                };
                // console.log(emailToSend);

                await sendEmail({
                  emailData: emailToSend,
                });
              }
            }
            resetForm();
            refetch();
            setEmailSending(false);
            const revalidateResponse = revalidatePage();
            toast.success('Discipline Referral Created');
            queryClient.refetchQueries('allDisciplines');
            setStudentReferralIsFor(null);
            setShowForm(false);
          }}
        >
          <h2>Add a New Referral</h2>
          <DisplayError error={error as any} />
          <fieldset
            disabled={loading || emailSending}
            aria-busy={loading || emailSending}
          >
            <FormGroupStyles>
              <div>
                <label htmlFor="studentName">Student Name</label>
                <SearchForUserName
                  name="studentName"
                  value=""
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
              />
              <FormSelect
                currentValue={location}
                setValue={setLocation}
                name="location"
                listOfOptions={locationList}
              />

              <FormSelect
                currentValue={timeOfDay}
                setValue={setTimeOfDay}
                name="Time of Day"
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
                rows={5}
              />
            </label>

            <button type="submit">+ Publish</button>
          </fieldset>
        </Form>
      </FormContainerStyles>
    </div>
  );
};

export default NewDiscipline;
