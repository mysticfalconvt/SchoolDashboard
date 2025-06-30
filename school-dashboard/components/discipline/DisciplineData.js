import gql from 'graphql-tag';
import { useRouter } from 'next/dist/client/router';
import { useGQLQuery } from '../../lib/useGqlQuery';
import DisciplineCharts from './DisciplineCharts';
import DisciplineTable from './DisciplineTable';
import NewDiscipline from './DisciplineButton';
import { useUser } from '../User';
import isAllowed from '../../lib/isAllowed';
import CellPhoneAddButton from './CellPhoneAddButton';
import ShowCellphoneViolations from './ShowCellphoneViolations';
import GradientButton, { SmallGradientButton } from '../styles/Button';
import Loading from '../Loading';

export const DISCIPLINE_DATA = gql`
  query DISCIPLINE_DATA {
    allDisciplines(sortBy: date_DESC) {
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
    allCellPhoneViolations(sortBy: dateGiven_DESC) {
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

export default function DisciplineData() {
  const me = useUser();
  const router = useRouter();

  const { data, isLoading, isError, refetch } = useGQLQuery(
    'allDisciplines',
    DISCIPLINE_DATA
  );

  if (isLoading) return <Loading />;
  const { allDisciplines } = data || [];
  const disciplinesWithDateIncrimented = allDisciplines.map((d) => {
    const date = new Date(d.date);
    const dateIncrimented = new Date(date.setDate(date.getDate() + 1));
    return {
      ...d,
      date: dateIncrimented,
    };
  });
  const canSeeAllDisciplines = isAllowed(me, 'canSeeAllDiscipline');
  const disciplinesToShow = canSeeAllDisciplines
    ? disciplinesWithDateIncrimented
    : disciplinesWithDateIncrimented.filter((d) => d?.teacher.id === me?.id);

  // get disciplines from current user
  const totalDisciplines = data?.allDisciplines?.length;
  if (!me || !me?.isStaff) return <p>Not available</p>;
  return (
    <>
      <div className="flex justify-around flex-wrap">
        <NewDiscipline refetch={refetch} />
        <GradientButton
          onClick={() =>
            router.push({
              pathname: `Bullying`,
            })
          }
          style={{ maxHeight: '4rem' }}
        >
          Hazing Harassment Bullying
        </GradientButton>
        <CellPhoneAddButton refetch={refetch} />
        <ShowCellphoneViolations
          cellViolations={data?.allCellPhoneViolations}
        />
      </div>
      <div className="flex justify-around flex-wrap">
        <div className="max-w-[500px]">
          <h2 className="text-center">{totalDisciplines} Total Referrals</h2>
          <DisciplineTable disciplines={disciplinesToShow} />
        </div>
        <div className="max-w-[500px]">
          <DisciplineCharts disciplines={disciplinesWithDateIncrimented} />
        </div>
      </div>
    </>
  );
}
