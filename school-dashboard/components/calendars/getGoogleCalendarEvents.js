export async function getGoogleCalendarEvents() {
  console.log("getGoogleCalendarEvents!!");
  const baseUrlLocalorProd =
    process.env.NODE_ENV === "development"
      ? "http://localhost:7777"
      : "https://ncujhs.tech";

  const initialGoogleCalendarEvents = await fetch(
    `${baseUrlLocalorProd}/api/googleCalendarData`
  ).then((res) => res.json());
  console.log("initialGoogleCalendarEvents", initialGoogleCalendarEvents);
  return initialGoogleCalendarEvents;
}
