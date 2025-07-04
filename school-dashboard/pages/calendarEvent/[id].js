import { GraphQLClient } from "graphql-request";
import { getDatasetAtEvent } from "react-chartjs-2";
import { endpoint, prodEndpoint } from "../../config";
import { useUser } from "../../components/User";
import EditCalendarEvent from "../../components/calendars/EditCalendar";
import isAllowed from "../../lib/isAllowed";
import gql from "graphql-tag";

export default function CalendarEvent({ query, data: calendar }) {
  const me = useUser();
  if (!calendar) {
    return <div>No Event Found...</div>;
  }

  const date = new Date(calendar.date).toLocaleDateString();
  const dateCreated = new Date(calendar.dateCreated).toLocaleDateString();
  const daysUntil = new Date(calendar.date).getTime() - Date.now();
  const daysUntilString = Math.ceil(daysUntil / (1000 * 60 * 60 * 24));
  const daysUntilStringPlural = daysUntilString === 1 ? "day" : "days";
  const eventDayOfTheWeek = new Date(calendar.date).toLocaleDateString(
    "en-US",
    { weekday: "long" }
  );
  const eventHasLink = calendar.link ? true : false;
  const linkWithHTTP = calendar.link.startsWith("http")
    ? calendar.link
    : `http://${calendar.link}`;
  const eventLinkTitle = calendar.linkTitle
    ? `Link: ${calendar.linkTitle}`
    : "Attached Link";
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-[var(--background-color)] p-5 rounded-md shadow-md overflow-hidden">
      <h1>{calendar.name}</h1>
      <p>{calendar.description}</p>
      <p>
        {eventDayOfTheWeek} - {date}
      </p>
      <p>
        {daysUntilString} {daysUntilStringPlural} until event
      </p>
      {eventHasLink && <a href={linkWithHTTP}>{eventLinkTitle}</a>}
      <br />
      <p>Event is for Students or Teachers: {calendar.status}</p>
      <p>
        Event was created by: {calendar.author?.name} on {dateCreated}
      </p>
      {isAllowed(me, "isStaff") ? (
        <EditCalendarEvent calendar={calendar} />
      ) : null}
    </div>
  );
}

const GET_SINGLE_CALENDAR_EVENT = gql`
  query GET_SINGLE_CALENDAR($id: ID) {
    calendar(where: { id: $id }) {
      id
      name
      description
      status
      date
      dateCreated
      link
      linkTitle
      author {
        id
        name
      }
    }
  }
`;

export async function getServerSideProps(context) {
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
  const fetchThisCalendar = async () =>
    graphQLClient.request(GET_SINGLE_CALENDAR_EVENT, { id: context.query.id });

  const thisCalendar = await fetchThisCalendar();

  return {
    props: {
      query: context.query,
      data: thisCalendar.calendar,
    },
  };
}
