import React from 'react';

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
  creator?: {
    email: string;
  };
}

interface GoogleCalendarListProps {
  events: GoogleCalendarEvent[];
}

const GoogleCalendarList: React.FC<GoogleCalendarListProps> = ({ events }) => {
  return (
    <div>
      <h1>Google Calendar List</h1>
      <ul>
        {events.map((event) => (
          <li key={event.id}>
            <h2>{event.summary}</h2>
            <p>{event.description}</p>
            <p>
              <span>
                {new Date(
                  event?.start?.dateTime || event?.start?.date,
                ).toLocaleString()}
              </span>
              -
              <span>
                {new Date(
                  event?.end?.dateTime || event?.end?.date,
                ).toLocaleString()}
              </span>
            </p>
            <p>created by: {event?.creator?.email}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GoogleCalendarList;
