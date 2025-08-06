import { SmallGradientButton } from '@/components/styles/Button';
import { useUser } from '@/components/User';
import { useGqlMutation } from '@/lib/useGqlMutation';
import gql from 'graphql-tag';
import { useQueryClient } from 'react-query';

const CREATE_QUICK_PBIS = gql`
  mutation CREATE_QUICK_PBIS($teacher: ID!, $student: ID!) {
    createPbisCard(
      data: {
        teacher: { connect: { id: $teacher } }
        student: { connect: { id: $student } }
        category: "quick"
      }
    ) {
      id
      student {
        name
      }
      teacher {
        name
      }
    }
  }
`;

interface QuickPbisButtonProps {
  id: string;
  displayName?: string;
}

export default function QuickPbisButton({
  id,
  displayName,
}: QuickPbisButtonProps) {
  const me = useUser();
  const teacher = me.id;
  const [createCard, { loading, error, data }] =
    useGqlMutation(CREATE_QUICK_PBIS);
  // console.log(id);
  // const [updateCardCount, { loading: cardLoading }] = useGqlMutation(UPDATE_PBIS, {
  //   variables: { userId: id },
  // });
  const queryClient = useQueryClient();
  return (
    <SmallGradientButton
      style={{ marginLeft: '1rem' }}
      disabled={loading}
      onClick={async (e) => {
        e.preventDefault();
        // console.log(teacher);
        // console.log('creating card');
        await createCard({
          teacher,
          student: id,
        });
        // console.log(res);
        // await updateCardCount({});
        queryClient.refetchQueries();
      }}
    >
      {loading ? 'Please Wait' : ''}
      {displayName ? `Quick Card for ${displayName}` : 'Quick Card'}
    </SmallGradientButton>
  );
}
