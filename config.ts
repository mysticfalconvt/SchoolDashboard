// Client-side endpoint (determined once based on environment)
export const endpoint: string = process.env.NODE_ENV === 'development' 
  ? (process.env.NEXT_PUBLIC_ENDPOINT || `http://localhost:3000/api/graphql`)
  : (process.env.NEXT_PUBLIC_ENDPOINT || `https://api.ncujhs.tech/api/graphql`);

// Server-side endpoint (determined once based on environment, can access all env vars)
export const backendEndpoint: string = process.env.NODE_ENV === 'development'
  ? (process.env.LOCAL_BACKEND_ENDPOINT || process.env.ENDPOINT || `http://localhost:3000/api/graphql`)
  : (process.env.LOCAL_BACKEND_ENDPOINT || process.env.ENDPOINT || `https://api.ncujhs.tech/api/graphql`);
export const perPage: number = 4;
export const callbackDisabled: boolean =
  process.env.NEXT_PUBLIC_CALLBACK_DISABLED?.toLowerCase() === 'true' || false;
export const disciplineDisabled: boolean =
  process.env.NEXT_PUBLIC_DISCIPLINE_DISABLED === 'true' || false;

export const NUMBER_OF_BLOCKS: number = Number(
  process.env.NEXT_PUBLIC_NUMBER_OF_BLOCKS || 5,
);
export const ADMIN_ID: string | undefined = process.env.NEXT_PUBLIC_ADMIN_ID;

// Optional feature flag: enabled when env exists (either NEXT_PUBLIC_ or server env), disabled otherwise
export const PBIS_STUDENT_RANDOM_DRAWING_WINNERS: boolean = Boolean(
  process.env.NEXT_PUBLIC_PBIS_STUDENT_RANDOM_DRAWING_WINNERS ??
    process.env.PBIS_STUDENT_RANDOM_DRAWING_WINNERS,
);

// Chromebook check minimum frequency (days between checks)
export const CHROMEBOOK_CHECK_MIN_DAYS: number = Number(
  process.env.NEXT_PUBLIC_CHROMEBOOK_CHECK_MIN_FREQUENCY || 5,
);
