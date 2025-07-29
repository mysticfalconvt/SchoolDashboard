import { useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import React from 'react';
import useSendEmail from '../../lib/useSendEmail';
import GradientButton from '../styles/Button';
import { useUser } from '../User';

const CREATE_STUDENT_FOCUS = gql`
  mutation CREATE_STUDENT_FOCUS(
    $comments: String!
    $teacher: ID!
    $student: ID!
    $category: String!
  ) {
    createStudentFocus(
      data: {
        comments: $comments
        teacher: { connect: { id: $teacher } }
        student: { connect: { id: $student } }
        category: $category
      }
    ) {
      id
      student {
        id
        name
        taTeacher {
          id
          name
        }
      }
    }
  }
`;

interface Parent {
  email: string;
}

interface CallbackItem {
  id: string;
}

interface Student {
  id: string;
  name: string;
  parent: Parent[];
  callbackItems: CallbackItem[];
}

interface User {
  id: string;
  email: string;
}

interface EmailData {
  toAddress: string;
  fromAddress: string;
  subject: string;
  body: string;
}

interface EmailParentsAboutCallbackProps {
  student: Student;
  disabled: boolean;
}

function createEmail({
  toAddress,
  fromAddress,
  studentName,
  callbackNumber,
}: {
  toAddress: string;
  fromAddress: string;
  studentName: string;
  callbackNumber: number;
}): EmailData {
  const email = {
    toAddress,
    fromAddress,
    subject: `NCUJHS.Tech Update about ${studentName}`,
    body: `
        <p>This is an update about ${studentName}. They have ${callbackNumber} overdue assignments.</p>
        <p><a href="https://ncujhs.tech">Click here to sign in and view them</a></p>
        `,
  };
  return email;
}

export default function EmailParentsAboutCallback({
  student,
  disabled,
}: EmailParentsAboutCallbackProps) {
  const [loading, setLoading] = React.useState(false);
  const [createStudentFocus] = useMutation(CREATE_STUDENT_FOCUS);
  const [emailSent, setEmailSent] = React.useState(false);
  const me = useUser() as User;
  const { sendEmail, emailLoading } = useSendEmail();
  const studentName = student.name;
  const callbacks = student.callbackItems;
  const callbackCount = callbacks.length;
  const parentEmails = student.parent.map((parent) => parent.email);
  return (
    <GradientButton
      disabled={
        loading || emailLoading || !parentEmails.length || disabled || emailSent
      }
      onClick={async () => {
        setLoading(true);
        // Map over all parents
        parentEmails.map(async (email) => {
          // Create email
          const emailToSend = createEmail({
            toAddress: email,
            fromAddress: me.email,
            studentName,
            callbackNumber: callbackCount,
          });
          // Send email
          // console.log('sending email to', emailToSend);
          await sendEmail({
            variables: {
              emailData: emailToSend,
            },
          });
          return emailToSend;
        });
        // add note to student focus about parent emails
        const studentFocusRes = await createStudentFocus({
          variables: {
            comments: `Emailed parents ${parentEmails} about ${callbackCount} items on Callback`,
            category: 'Parent Contact',
            teacher: me?.id,
            student: student.id,
          },
        });
        // console.log('studentFocusRes', studentFocusRes);
        setEmailSent(true);
        setLoading(false);
      }}
    >
      {loading ? 'Sending...' : null}
      {!emailSent ? 'Email Parents about Callback' : 'Email Sent'}
    </GradientButton>
  );
}
