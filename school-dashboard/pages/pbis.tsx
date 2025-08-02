import gql from 'graphql-tag';
import { GetStaticProps, NextPage } from 'next';
import Link from 'next/link';
import DoughnutChart from '../components/Chart/DonutChart';
import DisplayPbisCollectionData from '../components/PBIS/DisplayPbisCollectionData';
import PbisCardChart from '../components/PBIS/PbisCardChart';
import PbisFalcon from '../components/PBIS/PbisFalcon';
import { SmallGradientButton } from '../components/styles/Button';
import { useUser } from '../components/User';
import { ADMIN_ID, endpoint, prodEndpoint } from '../config';
import { GraphQLClient } from '../lib/graphqlClient';
import isAllowed from '../lib/isAllowed';
import { useGQLQuery } from '../lib/useGqlQuery';

const PBIS_PAGE_QUERY = gql`
  query PBIS_PAGE_QUERY($teamId: ID) {
    totalTeamCards: pbisCardsCount(
      where: { student: { taTeacher: { taTeam: { id: { equals: $teamId } } } } }
    )

    teamData: pbisCards(
      where: { student: { taTeacher: { taTeam: { id: { equals: $teamId } } } } }
    ) {
      id
      dateGiven
      category
      counted
    }
  }
`;

const PBIS_PAGE_STATIC_QUERY = gql`
  query PBIS_PAGE_STATIC_QUERY($lastCollectionDate: DateTime) {
    totalSchoolCards: pbisCardsCount

    chromebookCards: pbisCardsCount(
      where: { category: { equals: "Chromebook Check" } }
    )
    perseveranceCards: pbisCardsCount(
      where: { category: { equals: "perseverance" } }
    )
    respectCards: pbisCardsCount(where: { category: { equals: "respect" } })
    responsibilityCards: pbisCardsCount(
      where: { category: { equals: "responsibility" } }
    )
    quickCards: pbisCardsCount(where: { category: { equals: "quick" } })
    physicalCards: pbisCardsCount(where: { category: { equals: "physical" } })
    classCards: pbisCardsCount(where: { category: { equals: "class" } })

    TAs: users(where: { hasTA: { equals: true } }) {
      id
      name
      taTeamPbisLevel
      taTeamAveragePbisCardsPerStudent
      taStudents {
        id
        name
        studentPbisCardsCount
        uncountedCards: studentPbisCardsCount(
          where: { dateGiven: { gt: $lastCollectionDate } }
        )
        individualPbisLevel
      }
    }

    lastCollection: pbisCollectionDates(
      orderBy: { collectionDate: desc }
      take: 2
    ) {
      id
      collectionDate
      taNewLevelWinners {
        id
        name
        taTeamPbisLevel
        taTeamAveragePbisCardsPerStudent
      }
      personalLevelWinners {
        id
        name
        individualPbisLevel
      }
      staffRandomWinners {
        id
        name
        email
      }
      randomDrawingWinners {
        id
        student {
          id
          name
          taTeacher {
            name
          }
        }
      }
    }

    pbisLinks: links(where: { forPbis: { equals: true } }) {
      id
      link
      name
      description
      forParents
      forTeachers
      forStudents
    }
    cardCounts: pbisCollectionDates(orderBy: { collectionDate: asc }) {
      id
      collectionDate
      collectedCards
    }
  }
`;

interface PbisCard {
  id: string;
  dateGiven: string;
  category: string;
  counted: boolean;
}

interface TaStudent {
  id: string;
  name: string;
  studentPbisCardsCount: number;
  uncountedCards: number;
  individualPbisLevel: number;
}

interface TA {
  id: string;
  name: string;
  taTeamPbisLevel: number;
  taTeamAveragePbisCardsPerStudent: number;
  taStudents: TaStudent[];
}

interface PbisLink {
  id: string;
  link: string;
  name: string;
  description: string;
  forParents: boolean;
  forTeachers: boolean;
  forStudents: boolean;
}

interface CardCount {
  id: string;
  collectionDate: string;
  collectedCards: number;
}

interface CategoryData {
  word: string;
  total: number;
}

interface PbisPageProps {
  totalSchoolCards: number;
  schoolWideCardsInCategories: CategoryData[];
  lastPbisCollection: any;
  pbisLinks: PbisLink[];
  TAs: TA[];
  cardCounts: CardCount[];
  categoriesArray?: string[];
}

const Pbis: NextPage<PbisPageProps> = (props) => {
  const me = useUser();
  const teamId = me?.taTeam?.id || me?.taTeacher?.taTeam?.id || null;
  const TAs = props?.TAs || [];
  const teamName =
    me?.taTeam?.teamName || me?.taTeacher?.taTeam?.teamName || null;
  const { data, isLoading, error, refetch } = useGQLQuery(
    'PbisPageInfo',
    PBIS_PAGE_QUERY,
    {
      teamId: teamId || undefined, // Convert null to undefined to avoid sending null
      forTeachers: me?.isStaff || null,
      forStudents: me?.isStudent || null,
      forParents: me?.isParent || null,
    },
    {
      enabled: !!me && !!teamId, // Only run query when we have a valid teamId
    },
  );
  // if (isLoading) return <Loading />;
  // const cards = data?.cards;
  const totalSchoolCards = props?.totalSchoolCards || data?.totalSchoolCards;
  const schoolWideCardsInCategories =
    props?.schoolWideCardsInCategories || data?.schoolWideCardsInCategories;
  const hasTeam = !!teamId;
  const categoriesArray = props?.categoriesArray || [];
  const lastPbisCollection = props?.lastPbisCollection || null;
  const rawListOfLinks = props?.pbisLinks || [];
  const cardCounts = props?.cardCounts;
  const totalTeamCards = hasTeam ? data?.totalTeamCards || 0 : 0;

  // get the number of cards in each category for the team
  const teamWideCardsInCategories =
    categoriesArray?.map((category: string) => {
      const cardsInCategory = data?.teamData?.filter(
        (card: PbisCard) => card.category === category,
      );
      return {
        word: category,
        total: cardsInCategory?.length,
      };
    }) || [];

  // filter raw links to only show links for the user's role
  const links = rawListOfLinks?.filter((link: PbisLink) => {
    if (link.forParents && me?.isParent) return link;
    if (link.forTeachers && me?.isStaff) return link;
    if (link.forStudents && me?.isStudent) return link;
    return null;
  });

  return (
    <div>
      <div className="flex justify-around items-center w-full">
        {/* {JSON.stringify(rawListOfLinks)} */}
        <div>
          <h1 className="hidePrint">School-Wide PBIS Data</h1>
          {/* <p>{JSON.stringify(data.teamData)}</p> */}
          <h2 className="hidePrint">School-Wide Cards: {totalSchoolCards}</h2>
          {hasTeam && (
            <h2 className="hidePrint">
              Total Team Cards: {totalTeamCards || 'loading...'}
            </h2>
          )}
        </div>
        <div>
          <h2 className="hidePrint">Links</h2>
          <div className="flex justify-around items-center w-full flex-wrap">
            {isAllowed(me, 'canManagePbis') && (
              <>
                <Link href="/PbisWeeklyReading">
                  <SmallGradientButton title="Weekly Reading">
                    Weekly Reading
                  </SmallGradientButton>
                </Link>
                <Link href="/PbisDataTable">
                  <SmallGradientButton title="Data Table">
                    Data Table
                  </SmallGradientButton>
                </Link>
              </>
            )}
            {isAllowed(me, 'isStaff') && (
              <Link href="/studentsOfInterestPBIS">
                <SmallGradientButton title="Students of Interest">
                  Students of Interest
                </SmallGradientButton>
              </Link>
            )}
            {links?.map((link: PbisLink) => (
              <Link
                key={link.id}
                className="pbis-link"
                target="_blank"
                href={
                  link.link.startsWith('http')
                    ? link.link
                    : `http://${link.link}`
                }
              >
                <SmallGradientButton title={link.description}>
                  <h3 className="pbis-link-title">{link.name}</h3>
                </SmallGradientButton>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 justify-evenly items-center print:hidden">
        {me && <PbisFalcon initialCount={totalSchoolCards} />}
        <DoughnutChart
          title="School-Wide Cards By Category"
          chartData={schoolWideCardsInCategories}
        />
        {hasTeam && (
          <DoughnutChart
            title={`${teamName} Cards By Category`}
            chartData={teamWideCardsInCategories}
          />
        )}
      </div>
      <PbisCardChart className="hidePrint" cardCounts={cardCounts} />
      <div>
        {lastPbisCollection && (
          <DisplayPbisCollectionData collectionData={lastPbisCollection} />
        )}
      </div>
      <h3>Current Team Data</h3>
      <div className="grid grid-cols-4 gap-4 w-full print:break-before-page">
        {TAs?.filter((ta: TA) => ta.taStudents.length && ta.id !== ADMIN_ID)
          .sort((a: TA, b: TA) => a.taTeamPbisLevel - b.taTeamPbisLevel)
          .map((ta: TA) => (
            <div
              key={ta.id}
              className="text-center p-1 m-1 border border-gray-300 rounded print:break-inside-avoid"
            >
              <h3 className="text-blue-600 drop-shadow-[2px_2px_var(--red)]">
                {ta.name}
              </h3>

              <h4>Level -{ta.taTeamPbisLevel}-</h4>
              <p>{ta.taTeamAveragePbisCardsPerStudent} cards per student</p>
              <p>Total of {ta.taStudents?.length} students</p>
              <p>
                Uncounted cards:{' '}
                {ta.taStudents?.reduce(
                  (sum, student) => sum + (student.uncountedCards || 0),
                  0,
                )}
              </p>
              <div className="text-xs mt-2">
                {ta.taStudents?.map((student: TaStudent) => (
                  <div key={student.id} className="text-left">
                    <span className="font-semibold">{student.name}:</span>{' '}
                    {student.studentPbisCardsCount} total,{' '}
                    {student.uncountedCards} uncounted, Level{' '}
                    {student.individualPbisLevel}
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
      {/* {JSON.stringify(lastPbisCollection.taTeamsLevels)} */}
    </div>
  );
};

export const getStaticProps: GetStaticProps<PbisPageProps> = async (
  context,
) => {
  // fetch PBIS Page data from the server
  const headers = {
    credentials: 'include' as const,
    mode: 'cors' as const,
    headers: {
      authorization: `test auth for keystone`,
    },
  };

  const graphQLClient = new GraphQLClient(
    process.env.NODE_ENV === 'development' ? endpoint : prodEndpoint,
    headers,
  );
  const fetchData = async (): Promise<{
    totalSchoolCards: number;
    chromebookCards: number;
    classCards: number;
    quickCards: number;
    respectCards: number;
    responsibilityCards: number;
    perseveranceCards: number;
    physicalCards: number;
    lastCollection: any[];
    pbisLinks: PbisLink[];
    TAs: TA[];
    cardCounts: CardCount[];
  }> => {
    // First get the last collection date
    const lastCollectionQuery = gql`
      query GET_LAST_COLLECTION_DATE {
        lastCollection: pbisCollectionDates(
          orderBy: { collectionDate: desc }
          take: 1
        ) {
          id
          collectionDate
        }
      }
    `;

    const lastCollectionData = (await graphQLClient.request(
      lastCollectionQuery,
    )) as {
      lastCollection: Array<{ id: string; collectionDate: string }>;
    };
    const lastCollectionDate =
      lastCollectionData?.lastCollection?.[0]?.collectionDate ||
      new Date(0).toISOString();

    // Then get the main data with the last collection date
    return graphQLClient.request(PBIS_PAGE_STATIC_QUERY, {
      lastCollectionDate,
    });
  };
  const data = await fetchData();
  const totalSchoolCards = data?.totalSchoolCards || 0;

  // get the number of cards in each category for whole school
  const schoolWideCardsInCategories: CategoryData[] = [
    {
      word: 'Chromebook Check',
      total: data.chromebookCards || 0,
    },
    {
      word: 'class',
      total: data.classCards || 0,
    },
    {
      word: 'quick',
      total: data.quickCards || 0,
    },
    {
      word: 'respect',
      total: data.respectCards || 0,
    },
    {
      word: 'responsibility',
      total: data.responsibilityCards || 0,
    },
    {
      word: 'perseverance',
      total: data.perseveranceCards || 0,
    },
    {
      word: 'physical',
      total: data.physicalCards || 0,
    },
  ];

  const lastPbisCollection = data?.lastCollection[0] || null;
  const pbisLinks = data?.pbisLinks || [];
  const TAs = data?.TAs || [];

  return {
    props: {
      totalSchoolCards,
      schoolWideCardsInCategories,
      lastPbisCollection,
      pbisLinks,
      TAs,
      cardCounts: data?.cardCounts || [],
    },
    revalidate: false,
  };
};

export default Pbis;
