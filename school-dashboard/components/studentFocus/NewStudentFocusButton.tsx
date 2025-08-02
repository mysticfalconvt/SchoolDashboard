import DisplayError from '@/components/ErrorMessage';
import SearchForUserName from '@/components/SearchForUserName';
import GradientButton from '@/components/styles/Button';
import Form, {
  FormContainerStyles,
  FormGroupStyles,
} from '@/components/styles/Form';
import useForm from '@/lib/useForm';
import { useGqlMutation } from '@/lib/useGqlMutation';
import gql from 'graphql-tag';
import { useRouter } from 'next/dist/client/router';
import { useState } from 'react';
import { useQueryClient } from 'react-query';

import useRevalidatePage from '@/components/../lib/useRevalidatePage';
import useSendEmail from '@/components/../lib/useSendEmail';
import useCreateMessage from '@/components/Messages/useCreateMessage';
import { useUser } from '@/components/User';
import { useGQLQuery } from '@/lib/useGqlQuery';

const GET_GUIDANCE_EMAILS = gql`
  query GET_GUIDANCE_EMAILS {
    users(where: { isGuidance: { equals: true } }) {
      id
      name
      email
    }
  }
`;

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

interface FormInputs {
  category: string;
  comments: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface StudentUser {
  userId: string;
  userName: string;
}

interface GuidanceUser {
  id: string;
  name: string;
  email: string;
}

interface NewStudentFocusButtonProps {
  refetch: () => void;
}

export default function NewStudentFocusButton({
  refetch,
}: NewStudentFocusButtonProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const { inputs, handleChange, clearForm, resetForm } = useForm({
    category: 'General Comments',
  });
  const user = useUser() as User;
  const [studentWhoIsFor, setStudentWhoIsFor] = useState<StudentUser | null>(
    null,
  );
  const { data: guidance, isLoading } = useGQLQuery(
    `GuidanceEmails`,
    GET_GUIDANCE_EMAILS,
  );
  const guidanceAccounts = (guidance && guidance.users) || [];
  const guidanceEmailList = guidanceAccounts.map((g: GuidanceUser) => g.email);
  // console.log('guidanceEmailList', guidanceEmailList);
  const { sendEmail, emailLoading } = useSendEmail();
  const [createStudentFocus, { loading, error, data }] =
    useGqlMutation(CREATE_STUDENT_FOCUS);
  // TODO: send message when callback assigned
  const createMessage = useCreateMessage();
  const revalidatePage = useRevalidatePage('/studentFocus');
  //   console.log(inputs);
  return (
    <div>
      <GradientButton
        onClick={() => setShowForm(!showForm)}
        style={{ marginLeft: '100px' }}
      >
        {showForm ? 'Close the form' : 'New Student Focus'}
      </GradientButton>

      <FormContainerStyles>
        <Form
          className={showForm ? 'visible' : 'hidden'}
          // hidden={!showForm}
          onSubmit={async (e) => {
            e.preventDefault();
            // Submit the input fields to the backend:
            // console.log(inputs);
            setEmailSending(true);
            await createStudentFocus({
              comments: inputs.comments,
              category: inputs.category,
              teacher: user?.id,
              student: studentWhoIsFor?.userId,
            });
            // console.log(res);

            // Todo: send message when callback assigned
            createMessage({
              subject: 'New Student Focus',
              message: `${data?.createStudentFocus?.student.name} has a new Student Focus from ${user.name}`,
              receiver: data?.createStudentFocus?.student.taTeacher?.id,
              link: ``,
            });

            if (data?.createStudentFocus?.id) {
              for (const email of guidanceEmailList) {
                const emailToSend = {
                  toAddress: email,
                  fromAddress: user.email,
                  subject: `New Student Focus for ${data.createStudentFocus.student.name}`,
                  body: `
                <p>There is a new Student Focus Entry for ${data.createStudentFocus.student.name} at NCUJHS.TECH created by ${user.name}. </p>
                <p><a href="https://ncujhs.tech/studentFocus">Click Here to View</a></p> 
                `,
                };
                // console.log(emailToSend);
                const emailRes = await sendEmail({
                  emailData: emailToSend,
                });
              }
            }
            queryClient.refetchQueries('allStudentFocus');
            clearForm();
            setStudentWhoIsFor(null);
            setEmailSending(false);
            const revalidation = revalidatePage();
            setShowForm(false);
          }}
        >
          <h2>Add a New Student Focus</h2>
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
                  updateUser={setStudentWhoIsFor}
                  userType="isStudent"
                />
              </div>

              <label htmlFor="category">
                Category
                <select
                  required
                  id="category"
                  name="category"
                  value={inputs.category}
                  onChange={handleChange}
                >
                  <option value="Parent Contact">Parent Contact</option>
                  <option value="General Comments">General Comments</option>
                  <option value="Notes">Notes</option>
                </select>
              </label>
            </FormGroupStyles>
            <label htmlFor="comments">
              Comments
              <textarea
                id="comments"
                name="comments"
                placeholder="Comments"
                required
                value={inputs.comments}
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
}
