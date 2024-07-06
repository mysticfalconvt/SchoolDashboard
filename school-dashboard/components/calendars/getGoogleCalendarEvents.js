export async function getGoogleCalendarEvents() {
  const baseUrlLocalorProd =
    process.env.NODE_ENV === "development"
      ? "http://localhost:7777"
      : "https://ncujhs.tech";

  const initialGoogleCalendarEvents = await fetch(
    `${baseUrlLocalorProd}/api/googleCalendarData`
  ).then((res) => res.json());
  return initialGoogleCalendarEvents;
}
