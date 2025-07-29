import gql from 'graphql-tag';
import React from 'react';
import { capitalizeFirstLetter } from '../../lib/nameUtils';
import { useGQLQuery } from '../../lib/useGqlQuery';
import Loading from '../Loading';
import { useUser } from '../User';

interface Birthday {
  id: string;
  hasChosen?: boolean;
  cakeType?: string;
}

interface User {
  id: string;
  name: string;
  birthday?: Birthday;
}

interface MissingBirthdaysData {
  users: User[];
}

const MISSING_BIRTHDAYS_QUERY = gql`
  query {
    users(where: { isStudent: { equals: true } }) {
      id
      name
      birthday {
        id
        hasChosen
        cakeType
      }
    }
  }
`;

const MissingBirthdays: React.FC = () => {
  const me = useUser();
  const { data, isLoading, error } = useGQLQuery<MissingBirthdaysData>(
    'missingBirthdays',
    MISSING_BIRTHDAYS_QUERY,
    {},
    { enabled: !!me },
  );

  const needsToChooseCake = data?.users?.filter(
    (user) => !user?.birthday?.cakeType,
  );
  const needsBirthdayDate = data?.users?.filter((user) => !user.birthday);

  if (isLoading) return <Loading />;

  return (
    <div className="flex flex-row items-start justify-around">
      <div>
        <h3>Needs to choose a cake type</h3>
        {needsToChooseCake?.map((user) => (
          <div key={user.id}>
            <p>{capitalizeFirstLetter(user.name)}</p>
          </div>
        ))}
      </div>
      <div>
        <h3>Missing DOB</h3>
        {needsBirthdayDate?.map((user) => (
          <div key={user.id}>
            <p>{capitalizeFirstLetter(user.name)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MissingBirthdays;
