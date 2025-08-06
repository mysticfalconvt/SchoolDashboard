import gql from 'graphql-tag';
import { GetStaticProps, NextPage } from 'next';
import { useRouter } from 'next/dist/client/router';
import CellPhoneAddButton from '../components/discipline/CellPhoneAddButton';
import NewDiscipline from '../components/discipline/DisciplineButton';
import DisciplineCharts from '../components/discipline/DisciplineCharts';
import DisciplineExtraDetails from '../components/discipline/DisciplineExtraDetails';
import DisciplineTable from '../components/discipline/DisciplineTable';
import ShowCellphoneViolations from '../components/discipline/ShowCellphoneViolations';
import GradientButton from '../components/styles/Button';
import { useUser } from '../components/User';
import { endpoint, prodEndpoint } from '../config';
import { GraphQLClient } from '../lib/graphqlClient';
import isAllowed from '../lib/isAllowed';
import { useGQLQuery } from '../lib/useGqlQuery';

export const DISCIPLINE_DATA = gql`
  query DISCIPLINE_DATA {
    disciplines(orderBy: { date: desc }) {
      id
      date
      teacher {
        id
        name
      }
      student {
        name
        id
      }
      teacherComments
      classType
      location
      timeOfDay
      inappropriateLanguage
      physicalConduct
      nonCompliance
      disruption
      propertyMisuse
      otherConduct
      VerbalWarning
      buddyRoom
      conferenceWithStudent
      ParentContact
      PlanningRoomReferral
      FollowupPlan
      LossOfPrivilege
      DetentionWithTeacher
      IndividualizedInstruction
      GuidanceReferral
      ReferToAdministrator
      OtherAction
      none
      peers
      teacherInvolved
      substitute
      unknown
      othersInvolved
    }
    cellPhoneViolations(orderBy: { dateGiven: desc }) {
      id
      description
      dateGiven
      teacher {
        id
        name
      }
      student {
        id
        name
      }
    }
  }
`;

interface Discipline {
  id: string;
  date: string;
  teacher: {
    id: string;
    name: string;
  };
  student: {
    name: string;
    id: string;
  };
  teacherComments?: string;
  classType?: string;
  location?: string;
  timeOfDay?: string;
  inappropriateLanguage?: boolean;
  physicalConduct?: boolean;
  nonCompliance?: boolean;
  disruption?: boolean;
  propertyMisuse?: boolean;
  otherConduct?: boolean;
  VerbalWarning?: boolean;
  buddyRoom?: boolean;
  conferenceWithStudent?: boolean;
  ParentContact?: boolean;
  PlanningRoomReferral?: boolean;
  FollowupPlan?: boolean;
  LossOfPrivilege?: boolean;
  DetentionWithTeacher?: boolean;
  IndividualizedInstruction?: boolean;
  GuidanceReferral?: boolean;
  ReferToAdministrator?: boolean;
  OtherAction?: boolean;
  none?: boolean;
  peers?: boolean;
  teacherInvolved?: boolean;
  substitute?: boolean;
  unknown?: boolean;
  othersInvolved?: boolean;
}

interface CellPhoneViolation {
  id: string;
  description?: string;
  dateGiven: string;
  teacher: {
    id: string;
    name: string;
  };
  student: {
    id: string;
    name: string;
  };
}

interface DisciplinePageProps {
  initialDisciplineData: {
    disciplines: Discipline[];
    cellPhoneViolations: CellPhoneViolation[];
  };
}

const Discipline: NextPage<DisciplinePageProps> = (props) => {
  // console.log('Discipline props: ', props);
  const me = useUser();
  const router = useRouter();

  const { data, isLoading, isError, refetch } = useGQLQuery(
    'allDisciplines',
    DISCIPLINE_DATA,
    {},
    {
      staleTime: 0,
      initialData: props?.initialDisciplineData,
    },
  );

  // if (isLoading) return <Loading />;
  const allDisciplines = data?.disciplines || [];
  const disciplinesWithDateIncrimented = allDisciplines?.map(
    (d: Discipline) => {
      const date = new Date(d.date);
      const dateIncrimented = new Date(date.setDate(date.getDate() + 1));
      return {
        ...d,
        date: dateIncrimented,
      };
    },
  );
  const canSeeAllDisciplines = isAllowed(me, 'canSeeAllDiscipline');
  const disciplinesToShow = canSeeAllDisciplines
    ? disciplinesWithDateIncrimented
    : disciplinesWithDateIncrimented?.filter(
        (d: any) => d?.teacher.id === me?.id,
      );

  // get disciplines from current user
  const totalDisciplines = data?.disciplines?.length;
  if (!me || !me?.isStaff) return <p>Not available</p>;
  return (
    <>
      <div className="flex justify-around flex-wrap gap-4">
        <NewDiscipline refetch={refetch as any} />
        <GradientButton
          onClick={() =>
            router.push({
              pathname: `Bullying`,
            })
          }
          // style={{ maxHeight: "4rem" }}
        >
          Hazing Harassment Bullying
        </GradientButton>
        <CellPhoneAddButton />
        <ShowCellphoneViolations cellViolations={data?.cellPhoneViolations} />
        <a href="https://docs.google.com/forms/u/2/d/e/1FAIpQLSddBPipLhsUlH11wTb0oO85uKI4GZdBhtbmien7vrmw0fug7g/viewform?usp=sf_link">
          <GradientButton>Student Concerns Form Behavior Team</GradientButton>
        </a>
        {isAllowed(me, 'canManageDiscipline') ? (
          <DisciplineExtraDetails disciplines={disciplinesToShow as any} />
        ) : null}
      </div>
      <div className="flex justify-around flex-wrap gap-4">
        <div>
          <h2 className="text-center">{totalDisciplines} Total Referrals</h2>
          <DisciplineTable disciplines={disciplinesToShow as any} />
        </div>
        <div>
          <DisciplineCharts
            disciplines={disciplinesWithDateIncrimented as any}
          />
        </div>
      </div>
    </>
  );
};

export const getStaticProps: GetStaticProps<DisciplinePageProps> = async (
  context,
) => {
  // console.log(context);
  // fetch PBIS Page data from the server
  const graphQLClient = new GraphQLClient(
    process.env.NODE_ENV === 'development' ? endpoint : prodEndpoint,
    {
      headers: {
        authorization: `test auth for keystone`,
      },
    },
  );
  const fetchDisciplineData = async (): Promise<{
    disciplines: Discipline[];
    cellPhoneViolations: CellPhoneViolation[];
  }> => graphQLClient.request(DISCIPLINE_DATA);

  const initialDisciplineData = await fetchDisciplineData();

  return {
    props: {
      initialDisciplineData,
    }, // will be passed to the page component as props
    revalidate: 1200, // In seconds
  };
};

export default Discipline;
