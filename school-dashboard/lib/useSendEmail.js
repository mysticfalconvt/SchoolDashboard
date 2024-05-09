import { useMutation } from "@apollo/client";
import gql from "graphql-tag";
import { useEffect, useState } from "react";

const SEND_EMAIL_MUTATION = gql`
  mutation SEND_EMAIL_MUTATION($emailData: JSON!) {
    sendEmail(emailData: $emailData)
  }
`;

export default function useSendEmail() {
  const [email, setEmail] = useState(null);

  const [sendEmail, { loading: emailLoading }] =
    useMutation(SEND_EMAIL_MUTATION);

  useEffect(() => {
    if (email) {
      // console.log('emailing');
      // console.log(email);
      const emailToSend = email;
      // console.log(emailToSend);
      sendEmail({
        variables: {
          emailData: emailToSend,
        },
      });
    }
  }, [email, sendEmail]);

  return { setEmail, emailLoading, sendEmail };
}
