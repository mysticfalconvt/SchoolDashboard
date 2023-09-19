// import { gql, useQuery } from '@apollo/client';
import { useGQLQuery } from "../lib/useGqlQuery";
import { request, gql, GraphQLClient } from "graphql-request";
import { endpoint, prodEndpoint } from "../config";

const GET_ALL_PBIS_DATES_QUERY = gql`
  # sort by date descending
  query GET_ALL_PBIS_DATES {
    pbisCollectionDates(orderBy: { collectionDate: desc }) {
      id
      collectionDate
    }
  }
`;

const CURRENT_USER_QUERY = gql`
  query ($date: DateTime!) {
    authenticatedItem {
      __typename
      ... on User {
        id
        email
        name
        preferredName
        canManageCalendar
        canSeeOtherUsers
        canManageUsers
        canManageRoles
        canManageLinks
        canManageDiscipline
        canSeeAllDiscipline
        canSeeAllTeacherEvents
        canSeeStudentEvents
        canSeeOwnCallback
        canSeeAllCallback
        canManagePbis
        canHaveSpecialGroups
        hasTA
        hasClasses
        isStudent
        isParent
        isStaff
        isTeacher
        isSuperAdmin
        PbisCardCount: studentPbisCardsCount(
          where: { dateGiven: { gte: $date } }
        )
        YearPbisCount: studentPbisCardsCount
        teacherPbisCardCount: teacherPbisCardsCount(
          where: { dateGiven: { gte: $date } }
        )
        teacherYearPbisCount: teacherPbisCardsCount
        sortingHat
        children {
          id
          name
        }
        studentPbisCards(
          orderBy: { dateGiven: desc }
          take: 20
          where: { category: { not: { equals: "physical" } } }
        ) {
          id
          cardMessage
          category
          teacher {
            id
            name
          }
          dateGiven
        }
        taTeam {
          id
          teamName
        }
        taTeacher {
          id
          taTeam {
            id
            teamName
          }
        }
        birthday {
          id
          cakeType
          date
        }
      }
    }
  }
`;

export function useUser() {
  const { data: pbisDates } = useGQLQuery(
    "pbisDates",
    GET_ALL_PBIS_DATES_QUERY
  );
  const latestCollectionDateOr2YearsAgo =
    pbisDates?.pbisCollectionDates[0]?.collectionDate ||
    new Date(new Date().setFullYear(new Date().getFullYear() - 2));
  const { data } = useGQLQuery(
    "me",
    CURRENT_USER_QUERY,
    {
      date: new Date(latestCollectionDateOr2YearsAgo),
    },
    {
      enabled: !!pbisDates,
    }
  );
  const userData = data?.authenticatedItem;
  if (userData) {
    userData.lastCollection = latestCollectionDateOr2YearsAgo;
  }
  if (userData?.isStaff) {
    userData.PbisCardCount = userData.teacherPbisCardCount;
    userData.YearPbisCount = userData.teacherYearPbisCount;
  }

  return userData;
}

export { CURRENT_USER_QUERY };
