import { useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import { useEffect, useState } from 'react';

const UPDATE_PBIS = gql`
  mutation UPDATE_PBIS($userId: ID!) {
    recalculatePBIS(userId: $userId) {
      id
    }
  }
`;

interface UseRecalculatePBISReturn {
  recalculatePbisFromId: (id: string) => void;
}

export default function useRecalculatePBIS(): UseRecalculatePBISReturn {
  const [studentIdToRecalculatePbis, recalculatePbisFromId] = useState<
    string | undefined
  >();

  const [updateCardCount, { loading: cardLoading }] = useMutation(UPDATE_PBIS, {
    variables: { userId: studentIdToRecalculatePbis },
  });
  useEffect(() => {
    if (studentIdToRecalculatePbis) {
      // console.log('updating');
      // console.log(`id: ${studentIdToRecalculatePbis}`);
      updateCardCount();
    }
  }, [studentIdToRecalculatePbis, updateCardCount]);

  return { recalculatePbisFromId };
}
