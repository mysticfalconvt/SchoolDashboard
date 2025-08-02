import gql from 'graphql-tag';
import { GetServerSideProps, NextPage } from 'next';
import Loading from '../../components/Loading';
import { useUser } from '../../components/User';
import { useGQLQuery } from '../../lib/useGqlQuery';

const SINGLE_BULLYING_DATA_QUERY = gql`
  query SINGLE_BULLYING_DATA_QUERY($id: ID!) {
    bullying(where: { id: $id }) {
      id
      studentOffender {
        id
        name
      }
      teacherAuthor {
        id
        name
      }
      dateReported
      dateOfEvent
      studentReporter
      employeeWitness
      studentWitness
      initialActions
      nextSteps
      reporter
      description
    }
  }
`;

interface BullyingData {
  id: string;
  studentOffender: {
    id: string;
    name: string;
  };
  teacherAuthor: {
    id: string;
    name: string;
  };
  dateReported: string;
  dateOfEvent: string;
  studentReporter?: string;
  employeeWitness?: string;
  studentWitness?: string;
  initialActions?: string;
  nextSteps?: string;
  reporter?: string;
  description?: string;
}

interface ViewSingleHHBProps {
  query: {
    id: string;
  };
}

const ViewSingleHHB: NextPage<ViewSingleHHBProps> = ({ query }) => {
  const me = useUser();
  const { data, isLoading, isError, refetch } = useGQLQuery(
    `singleBullying${query.id}`,
    SINGLE_BULLYING_DATA_QUERY,
    { id: query.id },
    // { enabled: !!me }
  );
  if (isLoading) return <Loading />;
  const bullying = data?.bullying as BullyingData;
  if (!bullying) return <div>Bullying record not found</div>;

  const dateReported = new Date(bullying?.dateReported).toLocaleDateString();
  const dateOfEvent = new Date(bullying?.dateOfEvent).toLocaleDateString();
  const nameWithFirstLetterOfBothNamesCapitalized = (name: string) => {
    const nameArray = name.split(' ');
    const firstName = nameArray[0];
    const lastName = nameArray[1];
    const firstLetterOfFirstName = firstName[0].toUpperCase();
    const firstLetterOfLastName = lastName[0].toUpperCase();
    const restOfFirstName = firstName.slice(1);
    const restOfLastName = lastName.slice(1);
    return `${firstLetterOfFirstName}${restOfFirstName} ${firstLetterOfLastName}${restOfLastName}`;
  };

  return (
    <div>
      <h1>
        {nameWithFirstLetterOfBothNamesCapitalized(
          bullying.studentOffender.name,
        )}
      </h1>
      <h3>Reported By: {bullying.teacherAuthor.name}</h3>
      <p>Reported on:{dateReported}</p>
      <p>Date of Events: {dateOfEvent}</p>
      <p>Student Reporter: {bullying.studentReporter}</p>
      <p>Employee Witness: {bullying.employeeWitness}</p>
      <p>Student Witness: {bullying.studentWitness}</p>
      <p>Initial Actions: {bullying.initialActions}</p>
      <p>Next Steps: {bullying.nextSteps}</p>
      <p>Reporter: {bullying.reporter}</p>
      <p>Description: {bullying.description}</p>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<
  ViewSingleHHBProps
> = async (context) => {
  return {
    props: {
      query: {
        id: context.params?.id as string,
      },
    },
  };
};

export default ViewSingleHHB;
