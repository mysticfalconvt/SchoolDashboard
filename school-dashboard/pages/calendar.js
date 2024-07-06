import { useState } from "react";
import { GraphQLClient } from "graphql-request";
import Calendars, { GET_CALENDARS } from "../components/calendars/Calendars";
import { LeftEdgeButton } from "../components/styles/Button";
import { endpoint, prodEndpoint } from "../config";
import { useQuery } from "react-query";
import GoogleCalendarList from "../components/calendars/GoogleCalendarList";
import { getGoogleCalendarEvents } from "../components/calendars/getGoogleCalendarEvents";
import { google } from "googleapis";

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

const getCalendarData = async (req, res) => {
  const calendarId = process.env.CALENDAR_ID;
  const scopes = [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events.readonly",
  ];
  const now = new Date(); // now
  const timeMin = new Date(now.getFullYear(), now.getMonth(), 1); // 1 week before current month
  const timeMax = new Date(now.getFullYear(), now.getMonth() + 4, 0); // 1 week after current month

  const credentials = JSON.parse(process.env.CREDENTIALS || "");

  const jwt = new google.auth.JWT(
    credentials.client_email,
    undefined,
    credentials.private_key,
    scopes
  );

  const loginAuth = google.auth.fromJSON(credentials);
  const calendar = await google.calendar({
    version: "v3",
    auth: loginAuth,
  });

  const Calendar = await calendar.events.list({
    auth: jwt,
    calendarId: calendarId,

    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),

    singleEvents: true,
    orderBy: "startTime",
  });

  const rawEvents = Calendar.data.items || [];

  let events = rawEvents.map((event) => {
    const status = "Both";
    const isGCDate = event.start.date ? true : false;
    const isGCDateTime = event.start.dateTime ? true : false;
    const startDate = new Date(event.start.date || event.start.dateTime);
    const endDate = new Date(event.end.date || event.end.dateTime);
    const isMultiDayEvent = endDate - startDate > 1000 * 60 * 60 * 24;
    const date = new Date(
      isGCDate ? startDate.setDate(startDate.getDate() + 1) : startDate
    );
    const name = event.summary;
    const description = event.description;
    const link = event.htmlLink;
    const id = event.id;
    return {
      status,
      isMultiDayEvent,
      isGCDate,
      isGCDateTime,
      date,
      endDate,
      name,
      description,
      link,
      id,
      isGoogleCalendarEvent: true,
    };
  });
  const multiDayEvents = events.filter((event) => {
    return event.isMultiDayEvent;
  });
  multiDayEvents.forEach((event) => {
    const start = new Date(event.date);
    const end = new Date(event.endDate);
    const days = (end - start) / (1000 * 60 * 60 * 24);
    for (let i = 1; i < days; i++) {
      const newDate = new Date(start);
      newDate.setDate(newDate.getDate() + i);
      const newEvent = {
        ...event,
        date: newDate.toISOString(),
        isMultiDayEvent: false,
      };
      events.push(newEvent);
    }
  });
  events = events.sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });
  return  events ;
};

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
  const initialGoogleCalendarEventsWithDates = await getCalendarData();
  const initialGoogleCalendarEvents = initialGoogleCalendarEventsWithDates.map(
    (event) => {
      return {
        ...event,
        date: new Date(event.date).toISOString(),
        endDate: new Date(event.endDate).toISOString(),
        description: event.description || "",
      };
    }
  )
  return {
    props: {
      initialCalendarDates,
      initialGoogleCalendarEvents: initialGoogleCalendarEvents || [],
    }, // will be passed to the page component as props
    revalidate: 1200, // In seconds
  };
}
