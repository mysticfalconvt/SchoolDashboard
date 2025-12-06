import { google } from 'googleapis';
import { GetStaticProps, NextPage } from 'next';
import { useState } from 'react';
import Calendars, { GET_CALENDARS } from '../components/calendars/Calendars';
import { LeftEdgeButton } from '../components/styles/Button';
import { smartGraphqlClient } from '../lib/smartGraphqlClient';

interface CalendarEvent {
  status: string;
  isMultiDayEvent: boolean;
  isGCDate: boolean;
  isGCDateTime: boolean;
  date: Date | string;
  endDate: Date | string;
  name: string;
  description: string;
  link: string;
  id: string;
  isGoogleCalendarEvent: boolean;
}

interface CalendarDates {
  label: string;
  date: string;
}

interface CalendarPageProps {
  initialCalendarDates: any;
  initialGoogleCalendarEvents: CalendarEvent[];
}

const Calendar: NextPage<CalendarPageProps> = (props) => {
  const weekAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const [calendarDates, setCalendarDates] = useState<CalendarDates>({
    label: 'upcoming',
    date: weekAgo.toISOString(),
  });

  function switchDates() {
    if (calendarDates.label === 'all') {
      setCalendarDates({ label: 'upcoming', date: weekAgo.toISOString() });
    } else {
      setCalendarDates({ label: 'all', date: '2011-02-28T20:48:00.000Z' });
    }
  }

  return (
    <div>
      <div>
        <LeftEdgeButton onClick={() => switchDates()}>
          <div className="vertical">
            {calendarDates.label === 'all'
              ? 'Show Upcoming Dates Only'
              : 'Show All Dates'}
          </div>
        </LeftEdgeButton>
      </div>
      {/* <GoogleCalendarList events={data?.events || []} /> */}
      <Calendars
        dates={calendarDates}
        initialData={props.initialCalendarDates}
        googleCalendarEvents={props.initialGoogleCalendarEvents as any}
      />
    </div>
  );
};

const getCalendarData = async (): Promise<CalendarEvent[]> => {
  try {
    // Check if Google APIs are available
    if (typeof google === 'undefined') {
      console.warn('Google APIs not available');
      return [];
    }

    const calendarId = process.env.CALENDAR_ID;
    if (!calendarId) {
      console.warn('CALENDAR_ID environment variable not set');
      return [];
    }

    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events.readonly',
    ];
    const now = new Date(); // now
    const timeMin = new Date(now.getFullYear(), now.getMonth(), 1); // 1 week before current month
    const timeMax = new Date(now.getFullYear(), now.getMonth() + 4, 0); // 1 week after current month

    const credentialsString = process.env.CREDENTIALS;
    if (!credentialsString) {
      console.warn('CREDENTIALS environment variable not set');
      return [];
    }

    // Debug: Log the first few characters to see what we're dealing with
    console.warn(
      'CREDENTIALS starts with:',
      credentialsString.substring(0, 10),
    );

    let credentials;
    try {
      // Try to clean up the string if it has quotes around it
      let cleanedString = credentialsString.trim();
      if (cleanedString.startsWith("'") && cleanedString.endsWith("'")) {
        cleanedString = cleanedString.slice(1, -1);
      } else if (cleanedString.startsWith('"') && cleanedString.endsWith('"')) {
        cleanedString = cleanedString.slice(1, -1);
      }

      credentials = JSON.parse(cleanedString);
    } catch (error) {
      console.warn('Failed to parse CREDENTIALS JSON:', error);
      console.warn('Raw CREDENTIALS value:', credentialsString);
      return [];
    }

    // Add retry logic for Google Calendar API
    const fetchWithRetry = async (retries = 3, delay = 1000) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const jwt = new google.auth.JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: scopes,
          });

          const loginAuth = google.auth.fromJSON(credentials);
          const calendar = await (google as any).calendar({
            version: 'v3',
            auth: loginAuth,
          });

          const Calendar = await calendar.events.list({
            auth: jwt,
            calendarId: calendarId,
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
          });

          // Check if the response is valid
          if (!Calendar || !Calendar.data) {
            throw new Error('Invalid response from Google Calendar API');
          }

          return Calendar;
        } catch (error) {
          console.warn(`Google Calendar API attempt ${attempt} failed:`, error);
          if (attempt === retries) {
            throw error;
          }
          // Wait before retrying (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, delay * attempt));
        }
      }
    };

    const Calendar = await fetchWithRetry();

    const rawEvents = Calendar.data.items || [];

    let events: CalendarEvent[] = rawEvents.map((event: any) => {
      const status = 'Both';
      const isGCDate = event.start.date ? true : false;
      const isGCDateTime = event.start.dateTime ? true : false;
      const startDate = new Date(
        event.start.date || event.start.dateTime || '',
      );
      const endDate = new Date(event.end.date || event.end.dateTime || '');
      const isMultiDayEvent =
        endDate.getTime() - startDate.getTime() > 1000 * 60 * 60 * 24;
      const date = new Date(
        isGCDate ? startDate.setDate(startDate.getDate() + 1) : startDate,
      );
      const name = event?.summary || '';
      const description = event?.description || '';
      const link = event?.htmlLink || '';
      const id = event.id || '';
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
      const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
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
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    const initialGoogleCalendarEvents = events.map((event) => {
      return {
        ...event,
        date: new Date(event.date).toISOString(),
        endDate: new Date(event.endDate).toISOString(),
        description: event.description || '',
      };
    });
    return initialGoogleCalendarEvents;
  } catch (error) {
    console.warn('Error fetching Google Calendar data:', error);

    // Log more details about the error
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      console.warn(
        'JSON parsing error - likely received HTML instead of JSON from Google Calendar API',
      );
    }

    return [];
  }
};

export const getStaticProps: GetStaticProps<CalendarPageProps> = async (
  context,
) => {
  try {
    // fetch PBIS Page data from the server
    // Use smart GraphQL client with automatic retry and fallback
    const fetchAllCalendars = async () => smartGraphqlClient.request(GET_CALENDARS);
    const initialCalendarDates = await fetchAllCalendars();
    // console.log('initialCalendarDates', initialCalendarDates);
    const initialGoogleCalendarEvents = await getCalendarData();
    return {
      props: {
        initialCalendarDates: initialCalendarDates?.calendars || [],
        initialGoogleCalendarEvents: initialGoogleCalendarEvents || [],
      }, // will be passed to the page component as props
      revalidate: 1200, // In seconds
    };
  } catch (error) {
    console.warn('Error during static generation for calendar page:', error);
    return {
      props: {
        initialCalendarDates: [],
        initialGoogleCalendarEvents: [],
      },
      revalidate: 1200,
    };
  }
};

export default Calendar;
