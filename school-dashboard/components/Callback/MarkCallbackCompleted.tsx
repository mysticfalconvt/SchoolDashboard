import { useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import toast from 'react-hot-toast';
import { useQueryClient } from 'react-query';
import { SmallGradientButton } from '../styles/Button';
import { useUser } from '../User';
import useRecalculateCallback from './recalculateCallback';

const MARK_CALLBACK_COMPLETED = gql`
  mutation MARK_CALLBACK_COMPLETED(
    $id: ID!
    $dateCompleted: DateTime!
    $daysLate: Int!
  ) {
    updateCallback(
      where: { id: $id }
      data: { dateCompleted: $dateCompleted, daysLate: $daysLate }
    ) {
      id
    }
  }
`;

interface Teacher {
  id: string;
}

interface Callback {
  id: string;
  teacher: Teacher;
  dateAssigned: string;
}

interface MarkCallbackCompletedProps {
  callback: Callback;
}

export default function MarkCallbackCompleted({
  callback,
}: MarkCallbackCompletedProps) {
  const queryClient = useQueryClient();
  const me = useUser();
  const today = new Date();
  const { setCallbackID } = useRecalculateCallback();
  const dateAssigned = new Date(callback.dateAssigned);
  const daysLate = Math.round(
    (today.getTime() - dateAssigned.getTime()) / 1000 / 60 / 60 / 24,
  );
  const [markCompleted, { loading, error }] = useMutation(
    MARK_CALLBACK_COMPLETED,
    {
      variables: {
        id: callback.id,
        dateCompleted: today,
        daysLate,
      },
    },
  );

  //   console.log(`late: ${daysLate}`);
  if (me?.id === callback.teacher.id) {
    return (
      <div className="flex flex-col items-center justify-center mt-4 mb-4 transition-all duration-800 ease-in-out">
        <SmallGradientButton
          type="button"
          className={loading ? 'scale-10 opacity-0' : ''}
          onClick={async () => {
            // console.log('marking completed');
            const res = await markCompleted();
            if (res) {
              toast.success('Callback marked as completed');
              setCallbackID(res.data.updateCallback.id);
            }
            // console.log(res.data.updateCallback.id);
            queryClient.refetchQueries();
          }}
        >
          Mark Completed {daysLate} Days overdue
        </SmallGradientButton>
      </div>
    );
  }
  return null;
}
