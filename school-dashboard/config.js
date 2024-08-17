// This is client side config only - don't put anything in here that shouldn't be public!
export const endpoint =
  process.env.ENDPOINT || `http://localhost:3000/api/graphql`;
export const prodEndpoint =
  process.env.ENDPOINT || `https://api.ncujhs.tech/api/graphql`;
export const perPage = 4;
export const callbackDisabled =
  process.env.NEXT_PUBLIC_CALLBACK_DISABLED || false;
export const disciplineDisabled =
  process.env.NEXT_PUBLIC_DISCIPLINE_DISABLED || false;

export const NUMBER_OF_BLOCKS = 5;
export const ADMIN_ID = process.env.NEXT_PUBLIC_ADMIN_ID;
