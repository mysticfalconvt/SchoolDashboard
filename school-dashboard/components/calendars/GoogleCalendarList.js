export default function GoogleCalendarList({ events }) {
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
                  event?.start?.dateTime || event?.start?.date
                ).toLocaleString()}
              </span>
              -
              <span>
                {new Date(
                  event?.end?.dateTime || event?.end?.date
                ).toLocaleString()}
              </span>
            </p>
            <p>created by: {event?.creator?.email}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
