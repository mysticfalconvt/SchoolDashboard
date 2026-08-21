import useSendEmail from '@/components/../lib/useSendEmail';
import GradientButton from '@/components/styles/Button';
import { useUser } from '@/components/User';
import { useGqlMutation } from '@/lib/useGqlMutation';
import { useGQLQuery } from '@/lib/useGqlQuery';
import gql from 'graphql-tag';
import React from 'react';

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

const GET_SPECIAL_GROUP_TEACHERS = gql`
  query GET_SPECIAL_GROUP_TEACHERS($studentId: ID!) {
    teachers: users(
      where: { specialGroupStudents: { some: { id: { equals: $studentId } } } }
    ) {
      id
      name
      email
    }
  }
`;

interface Parent {
  email: string;
}

interface CallbackItem {
  id: string;
  title: string;
  teacher: {
    id: string;
    name: string;
  };
}

interface Student {
  id: string;
  name: string;
  parent: Parent[];
  callbackItems: CallbackItem[];
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface SpecialGroupTeacher {
  id: string;
  name: string;
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
  callbackItems,
}: {
  toAddress: string;
  fromAddress: string;
  studentName: string;
  callbackItems: CallbackItem[];
}): EmailData {
  const callbackNumber = callbackItems.length;
  const assignmentList = callbackItems
    .map(
      (item) =>
        `<li><strong>${item.title}</strong> - ${item.teacher.name}</li>`,
    )
    .join('');

  const email = {
    toAddress,
    fromAddress,
    subject: `NCUJHS.Tech Update about ${studentName}`,
    body: `
        <p>This is an update about ${studentName}. They have ${callbackNumber} overdue assignments:</p>
        <ul>
          ${assignmentList}
        </ul>
        <p><a href="https://ncujhs.tech">Click here to sign in and view them</a></p>
        `,
  };
  return email;
}

function createTeacherNotificationEmail({
  teacherEmail,
  studentName,
  callbackItems,
  parentEmails,
}: {
  teacherEmail: string;
  studentName: string;
  callbackItems: CallbackItem[];
  parentEmails: string[];
}): EmailData {
  const callbackNumber = callbackItems.length;
  const assignmentList = callbackItems
    .map(
      (item) =>
        `<li><strong>${item.title}</strong> - ${item.teacher.name}</li>`,
    )
    .join('');

  const email = {
    toAddress: teacherEmail,
    fromAddress: teacherEmail, // Self-notification
    subject: `Parent Notification Sent for ${studentName} - Callback Items`,
    body: `
        <p>You have successfully sent parent notifications about ${studentName}'s callback items.</p>
        <p><strong>Student:</strong> ${studentName}</p>
        <p><strong>Number of callback items:</strong> ${callbackNumber}</p>
        <p><strong>Assignments:</strong></p>
        <ul>
          ${assignmentList}
        </ul>
        <p><strong>Parent emails notified:</strong></p>
        <ul>
          ${parentEmails.map((email) => `<li>${email}</li>`).join('')}
        </ul>
        <p>Parents were notified about the overdue assignments and can view them at <a href="https://ncujhs.tech">ncujhs.tech</a></p>
        <p>Messages were sent on ${new Date().toLocaleDateString()}</p>
        `,
  };
  return email;
}

function createSpecialGroupTeacherEmail({
  teacher,
  fromAddress,
  senderName,
  studentName,
  callbackItems,
  parentEmails,
}: {
  teacher: SpecialGroupTeacher;
  fromAddress: string;
  senderName: string;
  studentName: string;
  callbackItems: CallbackItem[];
  parentEmails: string[];
}): EmailData {
  const callbackNumber = callbackItems.length;
  const assignmentList = callbackItems
    .map(
      (item) =>
        `<li><strong>${item.title}</strong> - ${item.teacher.name}</li>`,
    )
    .join('');

  const email = {
    toAddress: teacher.email,
    fromAddress,
    subject: `Parent Notification Sent for ${studentName} - Your Special Group`,
    body: `
        <p>${studentName} is in your special group. ${senderName} just notified their parents about callback items.</p>
        <p><strong>Student:</strong> ${studentName}</p>
        <p><strong>Number of callback items:</strong> ${callbackNumber}</p>
        <p><strong>Assignments:</strong></p>
        <ul>
          ${assignmentList}
        </ul>
        <p><strong>Parent emails notified:</strong></p>
        <ul>
          ${parentEmails.map((parentEmail) => `<li>${parentEmail}</li>`).join('')}
        </ul>
        <p><a href="https://ncujhs.tech">Click here to sign in and view them</a></p>
        <p>Messages were sent on ${new Date().toLocaleDateString()}</p>
        `,
  };
  return email;
}

export default function EmailParentsAboutCallback({
  student,
  disabled,
}: EmailParentsAboutCallbackProps) {
  const [loading, setLoading] = React.useState(false);
  const [createStudentFocus] = useGqlMutation(CREATE_STUDENT_FOCUS);
  const [emailSent, setEmailSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const me = useUser() as User;
  const { sendEmail, emailLoading } = useSendEmail();
  const studentName = student.name;
  const callbacks = student.callbackItems;
  const callbackCount = callbacks.length;
  const parentEmails = student.parent.map((parent) => parent.email);
  const { data: specialGroupData } = useGQLQuery(
    `specialGroupTeachers-${student.id}`,
    GET_SPECIAL_GROUP_TEACHERS,
    { studentId: student.id },
    { enabled: !!student?.id, staleTime: 1000 * 60 * 5 },
  );
  // teachers who have this student in a special group get a copy of the
  // notification, minus whoever is sending it (they get their own copy below)
  const specialGroupTeachers: SpecialGroupTeacher[] = (
    specialGroupData?.teachers || []
  ).filter(
    (teacher: SpecialGroupTeacher) => teacher.email && teacher.id !== me?.id,
  );
  return (
    <div>
      <GradientButton
        disabled={
          loading ||
          emailLoading ||
          !parentEmails.length ||
          disabled ||
          (emailSent && !error) ||
          callbackCount === 0
        }
        onClick={async () => {
          setLoading(true);
          setError(null);
          try {
            // Send emails to all parents and wait for all to complete
            const emailPromises = parentEmails.map(async (email) => {
              // Create email
              const emailToSend = createEmail({
                toAddress: email,
                fromAddress: me.email,
                studentName,
                callbackItems: callbacks,
              });
              // Send email
              // console.log('sending email to', emailToSend);
              await sendEmail({
                emailData: emailToSend,
              });
              return emailToSend;
            });

            // Wait for all emails to be sent
            await Promise.all(emailPromises);

            // Send teacher notification email
            const teacherNotificationEmail = createTeacherNotificationEmail({
              teacherEmail: me.email,
              studentName,
              callbackItems: callbacks,
              parentEmails,
            });

            await sendEmail({
              emailData: teacherNotificationEmail,
            });

            // Notify any teacher who has this student in a special group
            await Promise.all(
              specialGroupTeachers.map(async (teacher) => {
                const specialGroupEmail = createSpecialGroupTeacherEmail({
                  teacher,
                  fromAddress: me.email,
                  senderName: me.name,
                  studentName,
                  callbackItems: callbacks,
                  parentEmails,
                });
                await sendEmail({
                  emailData: specialGroupEmail,
                });
              }),
            );

            // add note to student focus about parent emails
            const studentFocusRes = await createStudentFocus({
              comments: `Emailed parents ${parentEmails} about ${callbackCount} items on Callback${
                specialGroupTeachers.length
                  ? `. Also notified special group teacher(s) ${specialGroupTeachers
                      .map((teacher) => teacher.name)
                      .join(', ')}`
                  : ''
              }`,
              category: 'Parent Contact',
              teacher: me?.id,
              student: student.id,
            });
            // console.log('studentFocusRes', studentFocusRes);
            setEmailSent(true);
          } catch (error) {
            console.error('Error sending emails:', error);
            setError('Failed to send emails. Please try again.');
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading ? 'Sending...' : null}
        {error
          ? 'Error - Try Again'
          : !emailSent
            ? 'Email Parents about Callback'
            : 'Email Sent'}
      </GradientButton>
      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
    </div>
  );
}
