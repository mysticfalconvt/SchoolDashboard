import gql from 'graphql-tag';
import { useRouter } from 'next/dist/client/router';
import React from 'react';
import isAllowed from '../../lib/isAllowed';
import { useGQLQuery } from '../../lib/useGqlQuery';
import Loading from '../Loading';
import GradientButton from '../styles/Button';
import { useUser } from '../User';
import CellPhoneAddButton from './CellPhoneAddButton';
import NewDiscipline from './DisciplineButton';
import DisciplineCharts from './DisciplineCharts';
import DisciplineTable from './DisciplineTable';
import ShowCellphoneViolations from './ShowCellphoneViolations';

interface Teacher {
  id: string;
  name: string;
}

interface Student {
  name: string;
  id: string;
}

interface Discipline {
  id: string;
  date: string;
  teacher: Teacher;
  student: Student;
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
  teacher: Teacher;
  student: Student;
}

interface DisciplineData {
  allDisciplines: Discipline[];
  allCellPhoneViolations: CellPhoneViolation[];
}

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

const DisciplineData: React.FC = () => {
  const me = useUser();
  const router = useRouter();

  const { data, isLoading, isError, refetch } = useGQLQuery(
    'allDisciplines',
    DISCIPLINE_DATA,
  );

  if (isLoading) return <Loading />;

  const { allDisciplines } = data || { allDisciplines: [] };
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
        <CellPhoneAddButton />
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
};

export default DisciplineData;
