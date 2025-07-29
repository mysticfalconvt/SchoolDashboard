import { useGqlMutation } from '@/lib/useGqlMutation';
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

  const [updateCardCount, { loading: cardLoading }] =
    useGqlMutation(UPDATE_PBIS);
  useEffect(() => {
    if (studentIdToRecalculatePbis) {
      // console.log('updating');
      // console.log(`id: ${studentIdToRecalculatePbis}`);
      updateCardCount({
        userId: studentIdToRecalculatePbis,
      });
    }
  }, [studentIdToRecalculatePbis, updateCardCount]);

  return { recalculatePbisFromId };
}
