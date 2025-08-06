import GradientButton from '@/components/styles/Button';
import { useGqlMutation } from '@/lib/useGqlMutation';
import gql from 'graphql-tag';
import React, { useState } from 'react';
import { FaBirthdayCake } from 'react-icons/fa';
import { GrCheckbox, GrCheckboxSelected } from 'react-icons/gr';
import { useQueryClient } from 'react-query';

interface Cake {
  id: string;
  hasDelivered?: boolean;
  cakeType?: string;
}

interface DeliveredCakeProps {
  cake: Cake;
}

interface UpdateBirthdayData {
  updateBirthday: {
    id: string;
  };
}

interface UpdateBirthdayVariables {
  id: string;
  isDelivered: boolean;
}

const UPDATE_BIRTHDAY_FOR_DELIVERED_CAKE_MUTATION = gql`
  mutation UPDATE_BIRTHDAY_FOR_DELIVERED_CAKE_MUTATION(
    $id: ID!
    $isDelivered: Boolean!
  ) {
    updateBirthday(where: { id: $id }, data: { hasDelivered: $isDelivered }) {
      id
    }
  }
`;

const DeliveredCake: React.FC<DeliveredCakeProps> = ({ cake }) => {
  const isDelivered = cake.hasDelivered;
  const hasChosen = cake.cakeType;
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const [updateBirthday, { data, loading: mutationLoading, error }] =
    useGqlMutation<UpdateBirthdayData, UpdateBirthdayVariables>(
      UPDATE_BIRTHDAY_FOR_DELIVERED_CAKE_MUTATION,
    );

  return (
    <GradientButton
      disabled={loading || !hasChosen}
      onClick={async () => {
        setLoading(true);

        const updatedBirthday = await updateBirthday({
          id: cake.id,
          isDelivered: !isDelivered,
        });
        await queryClient.refetchQueries('AllBirthdays');
        setLoading(false);
      }}
    >
      <FaBirthdayCake />
      {isDelivered ? (
        <GrCheckboxSelected
          style={{
            background: 'green',
            marginInline: '10px',
          }}
        />
      ) : (
        <GrCheckbox style={{ background: 'red', marginInline: '10px' }} />
      )}
      <FaBirthdayCake />
    </GradientButton>
  );
};

export default DeliveredCake;
