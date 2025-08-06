import gql from 'graphql-tag';
import { useMemo } from 'react';
import { useGQLQuery } from '../lib/useGqlQuery';

// Create a static fallback date to prevent infinite re-renders
const TWO_YEARS_AGO = (() => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 2);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
})();

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

export interface User {
  id: string;
  email: string;
  name: string;
  preferredName?: string;
  canManageCalendar?: boolean;
  canSeeOtherUsers?: boolean;
  canManageUsers?: boolean;
  canManageRoles?: boolean;
  canManageLinks?: boolean;
  canManageDiscipline?: boolean;
  canSeeAllDiscipline?: boolean;
  canSeeAllTeacherEvents?: boolean;
  canSeeStudentEvents?: boolean;
  canSeeOwnCallback?: boolean;
  canSeeAllCallback?: boolean;
  canManagePbis?: boolean;
  canHaveSpecialGroups?: boolean;
  hasTA?: boolean;
  hasClasses?: boolean;
  isStudent?: boolean;
  isParent?: boolean;
  isStaff?: boolean;
  isTeacher?: boolean;
  isSuperAdmin?: boolean;
  PbisCardCount?: number;
  YearPbisCount?: number;
  teacherPbisCardCount?: number;
  teacherYearPbisCount?: number;
  sortingHat?: string;
  children?: Array<{ id: string; name: string }>;
  studentPbisCards?: Array<{
    id: string;
    cardMessage: string;
    category: string;
    teacher: { id: string; name: string };
    dateGiven: string;
  }>;
  taTeam?: { id: string; teamName: string };
  taTeacher?: {
    id: string;
    taTeam: { id: string; teamName: string };
  };
  birthday?: {
    id: string;
    cakeType?: string;
    date: string;
  };
  lastCollection?: string;
}

export function useUser(): User | undefined {
  const { data: pbisDates } = useGQLQuery(
    'pbisDates',
    GET_ALL_PBIS_DATES_QUERY,
    {},
    {
      staleTime: 10 * 60 * 1000, // 10 minutes - PBIS dates don't change often
      cacheTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  );

  // Memoize the date calculation to prevent infinite rerenders
  const latestCollectionDateOr2YearsAgo = useMemo(() => {
    return pbisDates?.pbisCollectionDates?.[0]?.collectionDate || TWO_YEARS_AGO;
  }, [pbisDates?.pbisCollectionDates?.[0]?.collectionDate]);

  // Memoize the date object creation to prevent query from re-running constantly
  const queryDate = useMemo(() => {
    return new Date(latestCollectionDateOr2YearsAgo);
  }, [latestCollectionDateOr2YearsAgo]);

  const { data } = useGQLQuery(
    `me`, // Include date in query key for proper caching
    CURRENT_USER_QUERY,
    {
      date: queryDate,
    },
    {
      enabled: !!pbisDates,
      staleTime: 5 * 60 * 1000, // 5 minutes - keep data fresh longer
      cacheTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer
      refetchOnWindowFocus: true, // refetch when window gains focus
      refetchOnMount: true, // refetch on component mount if data exists
      refetchOnReconnect: true, // refetch on network reconnect
    },
  );

  // Memoize the user data processing to prevent object recreation
  const userData = useMemo(() => {
    const user = data?.authenticatedItem as User | undefined;
    if (!user) return undefined;

    // Create a new object to avoid mutating the original
    const processedUser = { ...user };
    processedUser.lastCollection = latestCollectionDateOr2YearsAgo;

    if (processedUser.isStaff) {
      processedUser.PbisCardCount = processedUser.teacherPbisCardCount;
      processedUser.YearPbisCount = processedUser.teacherYearPbisCount;
    }

    return processedUser;
  }, [data?.authenticatedItem, latestCollectionDateOr2YearsAgo]);

  return userData;
}

export { CURRENT_USER_QUERY };
