import { useMutation } from '@apollo/client';
import gql from 'graphql-tag';

const DELETE_MESSAGE_MUTATION = gql`
  mutation DELETE_MESSAGE_MUTATION($id: ID!) {
    deleteMessage(where: { id: $id }) {
      id
    }
  }
`;

interface DeleteMessageVariables {
  id: string;
}

interface DeleteMessageData {
  deleteMessage: {
    id: string;
  };
}

export default function useDeleteMessage() {
  //   console.log(`message: ${JSON.stringify(message)}`);

  const [deleteMessage] = useMutation<
    DeleteMessageData,
    DeleteMessageVariables
  >(DELETE_MESSAGE_MUTATION, {});

  return deleteMessage;
}
