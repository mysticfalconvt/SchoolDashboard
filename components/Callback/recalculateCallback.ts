import { useGqlMutation } from '@/lib/useGqlMutation';
import gql from 'graphql-tag';
import { useEffect, useState } from 'react';

const RECALCULATE_CALLBACK_MUTATION = gql`
  mutation RECALCULATE_CALLBACK_MUTATION($callbackId: ID!) {
    recalculateCallback(callbackId: $callbackId) {
      id
    }
  }
`;

export default function useRecalculateCallback() {
  const [callbackIdToUpdate, setCallbackID] = useState<string | undefined>();
  // console.log(`id: ${callbackIdToUpdate}`);

  const [recalculate] = useGqlMutation(RECALCULATE_CALLBACK_MUTATION);
  useEffect(() => {
    if (callbackIdToUpdate) {
      recalculate({ callbackId: callbackIdToUpdate });
    }
  }, [callbackIdToUpdate, recalculate]);

  return { setCallbackID };
}
