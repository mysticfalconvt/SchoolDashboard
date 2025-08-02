import { useGqlMutation } from '@/lib/useGqlMutation';
import gql from 'graphql-tag';
import { useEffect, useState } from 'react';
import { useQueryClient } from 'react-query';
import { useUser } from '../User';

interface CreateMessageInput {
  subject: string;
  message: string;
  receiver: string;
  link: string;
}

interface CreateMessageVariables {
  subject: string;
  message: string;
  sender: string;
  receiver: string;
  link: string;
}

interface CreateMessageData {
  createMessage: {
    id: string;
  };
}

const CREATE_MESSAGE_MUTATION = gql`
  mutation CREATE_MESSAGE_MUTATION(
    $subject: String!
    $message: String!
    $link: String!
    $sender: ID!
    $receiver: ID!
  ) {
    createMessage(
      data: {
        subject: $subject
        message: $message
        sender: { connect: { id: $sender } }
        receiver: { connect: { id: $receiver } }
        link: $link
      }
    ) {
      id
    }
  }
`;

export default function useCreateMessage() {
  const queryClient = useQueryClient();
  const me = useUser();
  const [message, createMessage] = useState<CreateMessageInput | undefined>();
  //   console.log(`message: ${JSON.stringify(message)}`);

  const [createMessageMutation] = useGqlMutation<
    CreateMessageData,
    CreateMessageVariables
  >(CREATE_MESSAGE_MUTATION);

  useEffect(() => {
    if (message) {
      // console.log('creating message');
      // console.log(`message: ${JSON.stringify(message)}`);
      createMessageMutation({
        subject: message?.subject || '',
        message: message?.message || '',
        sender: me?.id || '',
        receiver: message?.receiver || '',
        link: message?.link || '',
      });
      setTimeout(() => {
        queryClient.refetchQueries('myMessages');
      }, 1000);
    }
  }, [message, createMessageMutation, queryClient]);

  return createMessage;
}
