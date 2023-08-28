import gql from "graphql-tag";
import styled from "styled-components";
import Link from "next/link";
import { GraphQLClient } from "graphql-request";
import { useUser } from "../components/User";
import { useGQLQuery } from "../lib/useGqlQuery";
import PbisFalcon from "../components/PBIS/PbisFalcon";
import DoughnutChart from "../components/Chart/DonutChart";
import DisplayPbisCollectionData from "../components/PBIS/DisplayPbisCollectionData";
import PbisCardChart from "../components/PBIS/PbisCardChart";
import GradientButton, {
  SmallGradientButton,
} from "../components/styles/Button";
import isAllowed from "../lib/isAllowed";
import { endpoint, prodEndpoint } from "../config";

const ChartContainerStyles = styled.div`
  display: grid;
  flex-wrap: wrap;
  grid-template-columns: repeat(3, minmax(150px, 350px));

  justify-content: space-evenly;
  align-items: center;
  @media print {
    display: none;
  }
`;

const AnnouncementStyle = styled.h2`
  text-align: center;
  font-size: 2em;
  font-weight: bold;
  color: red;
  animation: color-change 3s infinite;
  @keyframes color-change {
    0% {
      color: var(--red);
    }
    50% {
      color: var(--blue);
    }
    100% {
      color: var(--red);
    }
  }
`;
export const TeamCardStyles = styled.div`
  /* display: flex;
  flex-wrap: wrap;
  justify-content: space-around; */
  display: grid;
  grid-template-columns: repeat(4, minmax(200px, 1fr));
  page-break-before: always;
  width: 100%;
  div {
    page-break-inside: avoid;
    text-align: center;
    padding: 5px;
    margin: 5px;
    border: 1px solid #ccc;
    border-radius: 5px;
    h3 {
      color: var(--blue);
      text-shadow: 2px 2px var(--red);
    }
  }
`;
const TitleBarStyles = styled.div`
  display: flex;
  /* flex-direction: column; */
  justify-content: space-around;
  align-items: center;
  width: 100%;
  .pbisLinks {
    display: flex;
    /* flex-direction: column; */
    justify-content: space-around;
    align-items: center;
    width: 100%;
    flex-wrap: wrap;
    button {
      margin: 5px;
    }
  }
`;

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
  query PBIS_PAGE_STATIC_QUERY {
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

    TAs: users(where: { hasTA: { equals: true } }) {
      id
      name
      taTeamPbisLevel
      taTeamAveragePbisCardsPerStudent
      taStudents {
        studentPbisCardsCount
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

export default function Pbis(props) {
  const me = useUser();
  const teamId = me?.taTeam?.id || me?.taTeacher?.taTeam?.id || null;
  const TAs = props?.TAs || [];
  const teamName =
    me?.taTeam?.teamName || me?.taTeacher?.taTeam?.teamName || null;
  const { data, isLoading, error, refetch } = useGQLQuery(
    "PbisPageInfo",
    PBIS_PAGE_QUERY,
    {
      teamId,
      // countId: teamId,
      forTeachers: me?.isStaff || null,
      forStudents: me?.isStudent || null,
      forParents: me?.isParent || null,
    },
    {
      enabled: !!me && !!teamId,
    }
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
  const totalTeamCards = data?.totalTeamCards;

  // get the number of cards in each category for the team
  const teamWideCardsInCategories =
    categoriesArray?.map((category) => {
      const cardsInCategory = data?.teamData?.filter(
        (card) => card.category === category
      );
      return {
        word: category,
        total: cardsInCategory?.length,
      };
    }) || [];

  // filter raw links to only show links for the user's role
  const links = rawListOfLinks?.filter((link) => {
    if (link.forParents && me?.isParent) return link;
    if (link.forTeachers && me?.isStaff) return link;
    if (link.forStudents && me?.isStudent) return link;
    return null;
  });

  return (
    <div>
      <TitleBarStyles>
        {/* {JSON.stringify(rawListOfLinks)} */}
        <div>
          <h1 className="hidePrint">School-Wide PBIS Data</h1>
          {/* <p>{JSON.stringify(data.teamData)}</p> */}
          <h2 className="hidePrint">School-Wide Cards: {totalSchoolCards}</h2>
          {hasTeam && (
            <h2 className="hidePrint">
              Total Team Cards: {totalTeamCards || "loading..."}
            </h2>
          )}
        </div>
        <div>
          <h2 className="hidePrint">Links</h2>
          <div className="pbisLinks">
            {isAllowed(me, "canManagePbis") && (
              <>
                <Link to="/PbisWeeklyReading" href="/PbisWeeklyReading">
                  <SmallGradientButton title="Weekly Reading">
                    Weekly Reading
                  </SmallGradientButton>
                </Link>
                <Link to="/PbisDataTable" href="/PbisDataTable">
                  <SmallGradientButton title="Data Table">
                    Data Table
                  </SmallGradientButton>
                </Link>
              </>
            )}
            {isAllowed(me, "isStaff") && (
              <Link to="/studentsOfInterestPBIS" href="/studentsOfInterestPBIS">
                <SmallGradientButton title="Students of Interest">
                  Students of Interest
                </SmallGradientButton>
              </Link>
            )}
            {links?.map((link) => (
              <Link
                key={link.id}
                to={link.link}
                className="pbis-link"
                target="_blank"
                href={
                  link.link.startsWith("http")
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
      </TitleBarStyles>
      <ChartContainerStyles className="hidePrint">
        {me && <PbisFalcon initialCount={totalSchoolCards} />}
        <DoughnutChart
          title="School-Wide Cards By Category"
          chartData={schoolWideCardsInCategories}
          className="hidePrint"
        />
        {hasTeam && (
          <DoughnutChart
            title={`${teamName} Cards By Category`}
            chartData={teamWideCardsInCategories}
          />
        )}
      </ChartContainerStyles>
      <PbisCardChart className="hidePrint" cardCounts={cardCounts} />
      <div>
        {lastPbisCollection && (
          <DisplayPbisCollectionData collectionData={lastPbisCollection} />
        )}
      </div>
      <h3>Current Team Data</h3>
      <TeamCardStyles>
        {TAs?.filter(
          (ta) => ta.taStudents.length && ta.id !== "cl24ztaju149148z3qqm4c4d39"
        )
          .sort((a, b) => a.taTeamPbisLevel - b.taTeamPbisLevel)
          .map((ta) => (
            <div key={ta.id} className="gridCard">
              <h3>{ta.name}</h3>

              <h4>Level -{ta.taTeamPbisLevel}-</h4>
              <p>{ta.taTeamAveragePbisCardsPerStudent} cards per student</p>
              <p>Total of {ta.taStudents?.length} students</p>
            </div>
          ))}
      </TeamCardStyles>
      {/* {JSON.stringify(lastPbisCollection.taTeamsLevels)} */}
    </div>
  );
}

export async function getStaticProps(context) {
  // fetch PBIS Page data from the server
  const headers = {
    credentials: "include",
    mode: "cors",
    headers: {
      authorization: `test auth for keystone`,
    },
  };

  const graphQLClient = new GraphQLClient(
    process.env.NODE_ENV === "development" ? endpoint : prodEndpoint,
    headers
  );
  const fetchData = async () => graphQLClient.request(PBIS_PAGE_STATIC_QUERY);
  const data = await fetchData();
  const totalSchoolCards = data?.totalSchoolCards || 0;

  // get the number of cards in each category for whole school
  const schoolWideCardsInCategories = [
    {
      word: "Chromebook Check",
      total: data.chromebookCards || 0,
    },
    {
      word: "class",
      total: data.classCards || 0,
    },
    {
      word: "quick",
      total: data.quickCards || 0,
    },
    {
      word: "respect",
      total: data.respectCards || 0,
    },
    {
      word: "responsibility",
      total: data.responsibilityCards || 0,
    },
    {
      word: "perseverance",
      total: data.perseveranceCards || 0,
    },
    {
      word: "physical",
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
}
