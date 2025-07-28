import { useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from 'react-query';
import useForm from '../../lib/useForm';
import { useGQLQuery } from '../../lib/useGqlQuery';
import useRevalidatePage from '../../lib/useRevalidatePage';
import useSendEmail from '../../lib/useSendEmail';
import DisplayError from '../ErrorMessage';
import SearchForUserName from '../SearchForUserName';
import GradientButton from '../styles/Button';
import Form, { FormContainerStyles } from '../styles/Form';
import { useUser } from '../User';

const GET_ADMIN_EMAILS = gql`
  query GET_ADMIN_EMAILS {
    users(where: { canManageDiscipline: { equals: true } }) {
      id
      name
      email
    }
  }
`;

const ADD_CELLPHONE_MUTATION = gql`
  mutation ADD_CELLPHONE_MUTATION(
    $description: String!
    $student: ID!
    $teacher: ID!
  ) {
    createCellPhoneViolation(
      data: {
        description: $description
        teacher: { connect: { id: $teacher } }
        student: { connect: { id: $student } }
      }
    ) {
      id
      student {
        id
        name
      }
      description
    }
  }
`;

const GET_STUDENT_CELLPHONE_VIOLATIONS = gql`
  query GET_STUDENT_CELLPHONE_VIOLATIONS($id: ID!) {
    cellPhoneViolationsCount(where: { student: { id: { equals: $id } } })
  }
`;

interface AdminUser {
  id: string;
  name: string;
  email: string;
}

interface CellPhoneViolationInputs {
  description: string;
}

interface StudentCard {
  userId: string;
  name?: string;
}

const CellPhoneAddButton: React.FC = () => {
  const revalidatePage = useRevalidatePage('/discipline');
  const { data: adminEmails, isLoading } = useGQLQuery(
    `AdminEmails`,
    GET_ADMIN_EMAILS,
  );
  const queryClient = useQueryClient();
  const adminEmailArray = adminEmails?.users?.map((u: AdminUser) => u.email);
  // console.log(adminEmailArray);
  const [showForm, setShowForm] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const { inputs, handleChange, clearForm, resetForm } = useForm({
    description: '',
  });
  const me = useUser();

  const teacher = me?.id;
  const [studentCardIsFor, setStudentCardIsFor] = useState<
    StudentCard | undefined
  >();
  // console.log(studentCardIsFor);
  const { sendEmail, emailLoading } = useSendEmail();
  const { data: studentCellPhoneViolations } = useGQLQuery(
    `StudentCellPhoneViolations-${studentCardIsFor?.userId}`,
    GET_STUDENT_CELLPHONE_VIOLATIONS,
    {
      id: studentCardIsFor?.userId,
    },
    {
      enabled: !!studentCardIsFor?.userId,
    },
  );
  const description = `${inputs.description}${
    studentCellPhoneViolations?.cellPhoneViolationsCount
      ? ` - Violation #${
          studentCellPhoneViolations?.cellPhoneViolationsCount + 1
        }`
      : ''
  }`;
  const [createCellViolation, { loading, error, data }] = useMutation(
    ADD_CELLPHONE_MUTATION,
    {
      variables: {
        teacher,
        student: studentCardIsFor?.userId,
        description: description,
      },
    },
  );
  const isThirdViolation =
    studentCellPhoneViolations?.cellPhoneViolationsCount === 2;

  if (error) {
    console.log(error);
    return <p>{error.message}</p>;
  }
  return (
    <div>
      <GradientButton
        style={{ margin: '5px' }}
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? 'close' : 'New Cell Phone Violation'}
      </GradientButton>
      <FormContainerStyles>
        <Form
          className={showForm ? 'visible' : 'hidden'}
          style={{
            width: '500px',
            display: 'flex',
            flexDirection: 'column',
            transform: showForm ? 'translateX(-50%)' : null,
          }}
          onSubmit={async (e) => {
            e.preventDefault();
            // Submit the input fields to the backend:
            // console.log(inputs);
            setEmailSending(true);
            const res = await createCellViolation();
            // console.log(res);
            if (res.data.createCellPhoneViolation.id) {
              for (const email of adminEmailArray || []) {
                const emailToSend = {
                  toAddress: email,
                  fromAddress: me?.email || '',
                  subject: `New Cell Phone Violation for ${res.data.createCellPhoneViolation.student.name}`,
                  body: `
                  <p>There is a new Cell Phone Violation for ${
                    res.data.createCellPhoneViolation.student.name
                  } at NCUJHS.TECH created by ${me?.name}. </p>
                  <p><a href="https://ncujhs.tech/discipline">Click Here to View</a></p>
                  ${isThirdViolation ? '<p>Third Violation!!</p>' : ''}
                  <p>Violation Description: ${
                    res.data.createCellPhoneViolation.description
                  }</p>
                  `,
                };
                // console.log(emailToSend);
                const emailRes = await sendEmail({
                  variables: {
                    emailData: emailToSend,
                  },
                });
              }
            }

            if (res) {
              toast.success('Cell Phone Violation Created');
            }
            setEmailSending(false);
            const revalidationResponse = revalidatePage();
            // console.log(revalidationResponse);
            queryClient.refetchQueries('allDisciplines');
            resetForm();
            setShowForm(false);
          }}
        >
          <DisplayError error={error as any} />
          <h2>Cell Phone Violation</h2>
          <fieldset
            disabled={loading || emailSending}
            aria-busy={loading || emailSending}
          >
            <SearchForUserName
              name="studentName"
              value=""
              updateUser={setStudentCardIsFor}
              userType="isStudent"
            />
            {/* <FormGroupStyles> */}
            <label htmlFor="description">
              Description
              <input
                style={{ marginLeft: '0' }}
                required
                type="text"
                id="description"
                name="description"
                placeholder="Title of Assignment"
                value={inputs.description || ''}
                onChange={handleChange}
              />
            </label>
            {/* </FormGroupStyles> */}

            <button type="submit">+ Submit</button>
          </fieldset>
        </Form>
      </FormContainerStyles>
    </div>
  );
};

export default CellPhoneAddButton;
