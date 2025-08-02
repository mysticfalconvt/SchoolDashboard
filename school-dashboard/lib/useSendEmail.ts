import gql from 'graphql-tag';
import { useEffect, useState } from 'react';
import { useGqlMutation } from './useGqlMutation';

const SEND_EMAIL_MUTATION = gql`
  mutation SEND_EMAIL_MUTATION($emailData: JSON!) {
    sendEmail(emailData: $emailData)
  }
`;

interface EmailData {
  [key: string]: any;
}

export default function useSendEmail() {
  const [email, setEmail] = useState<EmailData | null>(null);

  const [sendEmail, { data, loading: emailLoading, error }] =
    useGqlMutation(SEND_EMAIL_MUTATION);

  useEffect(() => {
    if (email) {
      // console.log('emailing');
      // console.log(email);
      const emailToSend = email;
      // console.log(emailToSend);
      sendEmail({
        emailData: emailToSend,
      });
    }
  }, [email, sendEmail]);

  return { setEmail, emailLoading, sendEmail };
}
