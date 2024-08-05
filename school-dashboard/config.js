// This is client side config only - don't put anything in here that shouldn't be public!
export const endpoint =
  process.env.ENDPOINT || `http://localhost:3000/api/graphql`;
export const prodEndpoint =
  process.env.ENDPOINT || `https://oldapi.ncujhs.tech/api/graphql`;
export const perPage = 4;
