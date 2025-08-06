import React from 'react';
import { toast } from 'react-hot-toast';
import { useQueryClient } from 'react-query';
import useForm from '../../lib/useForm';
import { useNewParentAccount } from '../../lib/useNewParentAccount';
import useSendEmail from '../../lib/useSendEmail';
import GradientButton from '../styles/Button';
import Form, { FormContainer } from '../styles/Form';
import { User, useUser } from '../User';

interface Student {
  id: string;
  name: string;
  email?: string;
}

interface FormInputs {
  parentEmail: string;
  parentName: string;
}

interface SendParentEmailSignupButtonProps {
  student: Student;
}

export default function SendParentEmailSignupButton({
  student,
}: SendParentEmailSignupButtonProps) {
  const me = useUser() as User;
  const [showForm, setShowForm] = React.useState(false);
  const { inputs, handleChange, clearForm } = useForm({
    parentEmail: '',
    parentName: '',
  });
  const { setEmail, emailLoading } = useSendEmail();
  const [createParentAccount, creatingParentAccount] = useNewParentAccount();
  const queryClient = useQueryClient();
  if (!student) return null;
  return (
    <div>
      <GradientButton
        style={{ marginTop: '10px', marginBottom: '10px' }}
        onClick={() => setShowForm(!showForm)}
      >
        {showForm
          ? 'Hide  Parent Signup  '
          : 'Send A Parent Account Signup Email'}
      </GradientButton>
      <div style={{ position: 'relative', marginLeft: '-300px' }}>
        <FormContainer visible={showForm}>
          <Form
            className={showForm ? 'visible' : 'hidden'}
            onSubmit={async (e) => {
              e.preventDefault();
              // check if email is a valid email address
              const email = inputs.parentEmail;
              const name = inputs.parentName;
              if (!email) {
                setEmail(null);
                return;
              }

              // create parent account
              const data = await createParentAccount({
                parentEmail: email.toLowerCase(),
                parentName: name,
                student: student as User,
                teacher: me,
              });

              if (data) {
                toast(data.result, {
                  duration: 4000,
                  icon: '👨‍👧‍👦',
                });
                queryClient.refetchQueries();
              }

              clearForm();
              setShowForm(false);
            }}
          >
            <fieldset
              disabled={emailLoading || creatingParentAccount}
              aria-busy={emailLoading || creatingParentAccount}
            >
              <label htmlFor="parentEmail">
                Parent / Guardian Email
                <input
                  required
                  type="email"
                  id="parentEmail"
                  name="parentEmail"
                  placeholder="Parent Email"
                  value={inputs.parentEmail}
                  onChange={handleChange}
                />
              </label>
              {/* <label htmlFor="parentName">
                Parent / Guardian Name
                <input
                  required
                  type="name"
                  id="parentName"
                  name="parentName"
                  placeholder="Parent Name"
                  value={inputs.parentName}
                  onChange={handleChange}
                />
              </label> */}

              <button type="submit">Send Email</button>
            </fieldset>
          </Form>
        </FormContainer>
      </div>
    </div>
  );
}
