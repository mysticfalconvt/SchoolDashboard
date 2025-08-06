import gql from 'graphql-tag';
import { GetServerSideProps, NextPage } from 'next';
import { useState } from 'react';
import AdminDisciplineData from '../../components/discipline/AdminDisciplineData';
import Loading from '../../components/Loading';
import { useUser } from '../../components/User';
import {
  othersInvolvedList,
  studentConductList,
  teacherActionList,
} from '../../lib/disciplineData';
import isAllowed from '../../lib/isAllowed';
import { useGQLQuery } from '../../lib/useGqlQuery';

export const SINGLE_DISCIPLINE_DATA = gql`
  query SINGLE_DISCIPLINE_DATA($id: ID!) {
    discipline(where: { id: $id }) {
      id
      date
      teacher {
        id
        name
      }
      student {
        name
        id
        studentDisciplineCount
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
      adminComments
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
    studentDisciplineCount: number;
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
  adminComments?: string;
  [key: string]: any; // For dynamic property access
}

interface SingleDisciplineReferralPageProps {
  query: {
    id: string;
  };
}

export const getServerSideProps: GetServerSideProps<
  SingleDisciplineReferralPageProps
> = async (context) => {
  return {
    props: {
      query: {
        id: context.params?.id as string,
      },
    },
  };
};

const SingleDisciplineReferralPage: NextPage<
  SingleDisciplineReferralPageProps
> = ({ query }) => {
  const me = useUser();
  const { data, isLoading, isError, refetch } = useGQLQuery(
    `singleDiscipline-${query.id}`,
    SINGLE_DISCIPLINE_DATA,
    {
      id: query.id,
    },
  );
  const [editing, setEditing] = useState(false);
  if (isLoading) return <Loading />;
  if (!me) return null;
  if (
    !(
      isAllowed(me, 'canSeeAllDiscipline') ||
      isAllowed(me, 'canManageDiscipline') ||
      me.id === data?.discipline?.teacher?.id
    )
  )
    return null;
  const discipline = data?.discipline as Discipline;
  if (!discipline) return <div>Discipline record not found</div>;

  const date = new Date(discipline?.date);
  // console.log(date);
  const dayAfterDate = date?.setDate(date.getDate() + 1).toLocaleString();
  // console.log(date);
  const dateToShow = date?.toDateString();
  // console.log(dateToShow);
  // get list of items in Discipline that are also in the others involved list
  const othersInvolvedListItems = othersInvolvedList.map((item) =>
    discipline[item] ? `☑️ ${item} ` : null,
  );
  const studentConductListItems = studentConductList.map((item) =>
    discipline[item] ? `☑️ ${item} ` : null,
  );
  const teacherActionListItems = teacherActionList.map((item) =>
    discipline[item] ? `☑️ ${item} ` : null,
  );

  //  function take array of strings in camelcase and return words with spaces
  const getListItems = (list: (string | null)[]) => {
    const listWithoutNulls = list.filter((item) => item !== null) as string[];
    // console.log(listWithoutNulls);
    const listAddSpaceBeforeEachCapital = listWithoutNulls.map((item) =>
      item.replace(/([A-Z])/g, ' $1'),
    );
    const listCapuitalizeFirstLetterAfterSpace =
      listAddSpaceBeforeEachCapital.map(
        (item) => item.charAt(0).toUpperCase() + item.slice(1),
      );
    return listCapuitalizeFirstLetterAfterSpace;
  };
  return (
    <div>
      <h1>
        Referral for {discipline?.student?.name} on {dateToShow}{' '}
      </h1>
      <div className="grid grid-cols-3 text-center print:hidden">
        <div className="m-2.5">
          <h2>Teacher: {discipline.teacher.name}</h2>
          <h2>Student: {discipline.student.name}</h2>
        </div>
        <div className="m-2.5">
          <h3>Date:</h3>
          <h3>{dateToShow}</h3>
          <p>
            Student's Referrals: {discipline.student.studentDisciplineCount}
          </p>
        </div>
        <div className="m-2.5">
          <p>Class Type: {discipline.classType}</p>
          <p>Location: {discipline.location}</p>
          <p>Time Of Day: {discipline.timeOfDay}</p>
        </div>
        <div className="m-2.5">
          <h3>Others Involved:</h3>
          <p>{getListItems(othersInvolvedListItems)}</p>
        </div>
        <div className="m-2.5">
          <h3>Student Conduct:</h3>
          <p>{getListItems(studentConductListItems)}</p>
        </div>
        <div className="m-2.5">
          <h3>Teacher Action:</h3>
          <p>{getListItems(teacherActionListItems)}</p>
        </div>
      </div>
      <h2 className="hidePrint">
        Teacher Comments (This is the original. It does not print):
      </h2>
      <p className="hidePrint">{discipline.teacherComments}</p>
      <AdminDisciplineData discipline={discipline} refetch={refetch} />
    </div>
  );
};

export default SingleDisciplineReferralPage;
