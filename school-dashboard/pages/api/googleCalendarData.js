// get google calendar events from google api
import { google } from "googleapis";

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
  // console.log("jwt", jwt);
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

  const events = rawEvents.map((event) => {
    const status = "Both";
    const date = new Date(event.start.dateTime || event.start.date);
    const endDate = new Date(event.end.dateTime || event.end.date);
    const name = event.summary;
    const description = event.description;
    const link = event.htmlLink;
    const id = event.id;
    return {
      status,
      date,
      endDate,
      name,
      description,
      link,
      id,
      isGoogleCalendarEvent: true,
    };
  });
  res.status(200).json({ events: events });
};

export default getCalendarData;