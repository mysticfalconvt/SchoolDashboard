import { useState } from "react";
import { GraphQLClient } from "graphql-request";
import Calendars, { GET_CALENDARS } from "../components/calendars/Calendars";
import { LeftEdgeButton } from "../components/styles/Button";
import { endpoint, prodEndpoint } from "../config";
import { useQuery } from "react-query";
import GoogleCalendarList from "../components/calendars/GoogleCalendarList";
import { getGoogleCalendarEvents } from "../components/calendars/getGoogleCalendarEvents";

export default function Calendar(props) {
  const weekAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const [calendarDates, setCalendarDates] = useState({
    label: "upcoming",
    date: weekAgo,
  });
  function switchDates() {
    if (calendarDates.label === "all") {
      setCalendarDates({ label: "upcoming", date: weekAgo });
    } else {
      setCalendarDates({ label: "all", date: "2011-02-28T20:48:00.000Z" });
    }
  }

  return (
    <div>
      <div>
        <LeftEdgeButton onClick={() => switchDates()}>
          <div className="vertical">
            {calendarDates.label === "all"
              ? "Show Upcoming Dates Only"
              : "Show All Dates"}
          </div>
        </LeftEdgeButton>
      </div>
      {/* <GoogleCalendarList events={data?.events || []} /> */}
      <Calendars
        dates={calendarDates}
        initialData={props.initialCalendarDates}
        googleCalendarEvents={props.initialGoogleCalendarEvents}
      />
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
  const fetchAllCalendars = async () => graphQLClient.request(GET_CALENDARS);

  const initialCalendarDates = await fetchAllCalendars();

  const initialGoogleCalendarEvents = await getGoogleCalendarEvents();

  return {
    props: {
      initialCalendarDates,
      initialGoogleCalendarEvents: initialGoogleCalendarEvents.events || [],
    }, // will be passed to the page component as props
    revalidate: 1200, // In seconds
  };
}
