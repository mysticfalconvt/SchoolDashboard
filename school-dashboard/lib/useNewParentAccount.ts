import gql from 'graphql-tag';
import { useState } from 'react';
import type { User } from '../components/User';
import { useGqlMutation } from './useGqlMutation';
import { useAsyncGQLQuery } from './useGqlQuery';
import useSendEmail from './useSendEmail';

const STUDENT_INFO_QUERY = gql`
  query STUDENT_INFO_QUERY($id: ID!) {
    user(where: { id: $id }) {
      id
      name
      email
      isStudent
      parent {
        id
        name
        email
      }
    }
  }
`;

const UPDATE_STUDENT_WITH_EXISTING_PARENT_MUTATION = gql`
  mutation UPDATE_STUDENT_WITH_EXISTING_PARENT_MUTATION(
    $id: ID!
    $parent: UserRelateToManyForUpdateInput!
  ) {
    updateUser(where: { id: $id }, data: { parent: $parent }) {
      id
    }
  }
`;

const PARENT_INFO_QUERY = gql`
  query PARENT_INFO_QUERY($email: String!) {
    users(where: { email: { equals: $email } }) {
      id
      name
      email
      isStudent
      isParent
      children {
        id
        name
        email
      }
    }
  }
`;

const SIGNUP_NEW_PARENT_MUTATION = gql`
  mutation SIGNUP_NEW_PARENT_MUTATION(
    $email: String!
    $name: String!
    $password: String!
    $children: UserRelateToManyForCreateInput!
    $isParent: Boolean!
  ) {
    createUser(
      data: {
        email: $email
        name: $name
        password: $password
        isParent: $isParent
        children: $children
      }
    ) {
      id
      name
      email
    }
  }
`;

const CREATE_PARENT_ACCOUNT_MUTATION = gql`
  mutation CREATE_PARENT_ACCOUNT_MUTATION(
    $email: String!
    $name: String!
    $password: String!
    $children: UserRelateToManyInput!
    $isParent: Boolean!
  ) {
    createUser(
      data: {
        email: $email
        name: $name
        password: $password
        isParent: $isParent
        children: $children
      }
    ) {
      id
      name
      email
    }
  }
`;

interface CreateParentAccountProps {
  parentEmail: string;
  parentName: string;
  student: User;
  teacher: User;
}

interface CreateParentAccountResult {
  result: string;
  email?: any;
}

export function useNewParentAccount() {
  const [creatingParentAccount, setCreatingParentAccount] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const { sendEmail, emailLoading } = useSendEmail();
  const getStudentData = useAsyncGQLQuery(STUDENT_INFO_QUERY);
  const getParentData = useAsyncGQLQuery(PARENT_INFO_QUERY);
  const [createNewUser, { data, loading, error }] = useGqlMutation(
    SIGNUP_NEW_PARENT_MUTATION,
  );
  const [
    updateStudentWithExistingParent,
    { data: updateData, loading: updatingStudent, error: updateStudentError },
  ] = useGqlMutation(UPDATE_STUDENT_WITH_EXISTING_PARENT_MUTATION);

  async function createParentAccount(
    props: CreateParentAccountProps,
  ): Promise<CreateParentAccountResult> {
    const { parentEmail, parentName, student, teacher } = props;
    setCreatingParentAccount(true);
    // get student's current parent info
    setStudentId(student.id);
    const studentWithParents = await getStudentData({ id: student.id });
    const { parent } = studentWithParents.user;

    const allParentEmails = parent.map((p: any) => p.email);
    // check if the parent email already exists with that student
    const parentEmailAlreadyExists = allParentEmails.includes(parentEmail);
    // If the parent email exists return because we don't want to create a new parent account
    if (parentEmailAlreadyExists) {
      setCreatingParentAccount(false);
      return { result: 'This Parent already exists!! No Account Created' };
    }

    // check if a parent account with the email address exists
    const existingParent = await getParentData({ email: parentEmail });

    const isThisAnExistingParent = existingParent?.users.length > 0;
    const existingParentID = existingParent?.users[0]?.id;

    // if there is an existing parent account with the email address
    // link this student to that parent account
    if (isThisAnExistingParent) {
      const res = await updateStudentWithExistingParent({
        id: student.id,
        parent: { connect: { id: existingParentID } },
      });
      setCreatingParentAccount(false);
      return {
        result: 'parent already existed.  Connected to this student account',
      };
    }

    // if not, create a new parent account
    const password = Math.random().toString(36).substring(2, 10);
    if (!isThisAnExistingParent) {
      const newParent = await createNewUser({
        email: parentEmail,
        name: parentEmail,
        password,
        children: { connect: { id: student.id } },
        isParent: true,
      });
      // email to parent with password
      const emailToSend = {
        toAddress: parentEmail,
        fromAddress: teacher.email,
        subject: `NCUJHS.Tech account - ${student.name}`,
        body: `
    <p>NCUJHS.Tech is a schoolwide dashboard. A parent account has been created for you.  To login use this email address (${parentEmail}).</p>
    <p><a href="https://ncujhs.tech">Click Here to View The NCUJHS School Dashboard</a></p>
    <p></p>
    <p>Ths account can be used to vew any overdue assignments (Callback) for ${student.name}</p>
    <p>School events, and other important school information is also available. </p>
    <p></p>
    <p>If you have any questions, please contact ${teacher.name} at ${teacher.email}</p>

    
     `,
      };
      const emailRes = await sendEmail({
        emailData: emailToSend,
      });
      setCreatingParentAccount(false);
      return {
        result: `New Parent Account Created for ${parentEmail}. Email with login sent to ${parentEmail}`,
        email: emailRes,
      };
    }

    setCreatingParentAccount(false);
    return { result: 'There was an error.  Please try again.' };
  }

  return [createParentAccount, creatingParentAccount] as const;
}
