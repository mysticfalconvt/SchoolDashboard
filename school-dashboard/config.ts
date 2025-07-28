// This is client side config only - don't put anything in here that shouldn't be public!
export const endpoint: string =
  process.env.ENDPOINT || `http://localhost:3000/api/graphql`;
export const prodEndpoint: string =
  process.env.ENDPOINT || `https://api.ncujhs.tech/api/graphql`;
export const perPage: number = 4;
export const callbackDisabled: boolean =
  process.env.NEXT_PUBLIC_CALLBACK_DISABLED?.toLowerCase() === 'true' || false;
export const disciplineDisabled: boolean =
  process.env.NEXT_PUBLIC_DISCIPLINE_DISABLED === 'true' || false;

export const NUMBER_OF_BLOCKS: number = Number(
  process.env.NEXT_PUBLIC_NUMBER_OF_BLOCKS || 5,
);
export const ADMIN_ID: string | undefined = process.env.NEXT_PUBLIC_ADMIN_ID;
