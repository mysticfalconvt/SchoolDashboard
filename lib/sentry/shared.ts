/**
 * Shared error-reporting configuration for Sentry.io and Bugsink.
 *
 * We dual-track during the rollover: every error event is sent to BOTH
 * destinations. Bugsink speaks the Sentry ingest protocol, so a single
 * `Sentry.init` with a multiplexed transport covers both.
 *
 * Bugsink is an ERROR TRACKER ONLY -- it ignores tracing, profiling, session
 * replay and cron monitors. So anything that is not an error envelope
 * (transactions, sessions, replays) is routed to Sentry.io alone rather than
 * being thrown away at a Bugsink endpoint that would just drop it.
 *
 * Reporting is a no-op unless at least one DSN is set, so a fresh checkout
 * with no .env stays quiet.
 */

/**
 * Release identifier. Injected at build time by `next.config.ts` (via the
 * `env` key) so the value the browser reports is byte-identical to the one the
 * sourcemaps were uploaded under. Do not set this by hand in .env unless you
 * also set `SENTRY_RELEASE` to the same value for the build.
 */
export const RELEASE: string | undefined =
  process.env.NEXT_PUBLIC_SENTRY_RELEASE || undefined;

export const ENVIRONMENT: string = process.env.NODE_ENV || 'development';

/**
 * Builds the destination list, dropping any DSN that is not configured.
 * Order matters only for readability -- envelopes are sent to every entry in
 * parallel.
 */
export function buildDestinations(
  sentryDsn?: string,
  bugsinkDsn?: string,
): string[] {
  return [sentryDsn, bugsinkDsn].filter(
    (dsn): dsn is string => typeof dsn === 'string' && dsn.length > 0,
  );
}

/**
 * Whether the SDK should initialise at all.
 *
 * Same condition on client and server: we need somewhere to send to, and we
 * only report from production builds. Set NEXT_PUBLIC_SENTRY_ENABLE_IN_DEV=true
 * to opt a local build in -- that is how you verify the Bugsink pipeline end to
 * end without deploying.
 */
export function reportingEnabled(destinations: string[]): boolean {
  if (destinations.length === 0) return false;
  if (process.env.NODE_ENV === 'production') return true;
  return process.env.NEXT_PUBLIC_SENTRY_ENABLE_IN_DEV === 'true';
}

/**
 * Routes an envelope to its destinations.
 *
 * Error events fan out to everything; everything else stays on Sentry.io.
 * Returning an empty array makes the multiplexed transport fall back to the
 * DSN passed to `Sentry.init`, which is why the no-Sentry-DSN case still works.
 */
export function makeDestinationMatcher(
  destinations: string[],
  sentryDsn?: string,
) {
  const nonErrorDestinations = sentryDsn ? [sentryDsn] : [];

  return ({ getEvent }: { getEvent: (types?: any[]) => unknown }): string[] => {
    const isErrorEvent = Boolean(getEvent(['event']));
    return isErrorEvent ? destinations : nonErrorDestinations;
  };
}

/**
 * Errors we never want to open an issue for.
 *
 * These are matched against the exception type, value and the event message.
 */
const IGNORED_ERRORS: (string | RegExp)[] = [
  // --- Failed / aborted network requests -------------------------------
  // Almost always a user navigating away mid-request, a flaky connection, or
  // the API restarting. Not an app fault.
  'Failed to fetch',
  'NetworkError when attempting to fetch resource',
  'Network request failed',
  'Load failed',
  'The user aborted a request',
  'The operation was aborted',
  'AbortError',
  'TypeError: cancelled',
  'terminated',
  /^Fetch error/i,
  /ECONNRESET|ECONNREFUSED|ETIMEDOUT|EPIPE/,

  // --- Expected auth failures ------------------------------------------
  // An expired session or a wrong password is a normal outcome of the login
  // flow, not a bug worth paging about.
  'Not authenticated',
  'Access denied',
  'You do not have access',
  /Unauthori[sz]ed/i,
  /Authentication (failed|required)/i,
  /Invalid (email|password|credentials|token)/i,
  'Session expired',

  // --- Browser extension / injected script noise ------------------------
  'ResizeObserver loop limit exceeded',
  'ResizeObserver loop completed with undelivered notifications',
  'Non-Error promise rejection captured',
  'Java exception was raised during method invocation',
  'top.GLOBALS',
  'originalCreateNotification',
  'canvas.contentDocument',
  'atomicFindClose',
  /^chrome-extension:/i,
  /^moz-extension:/i,
  /vendor\.js/,
];

/**
 * Stack frames originating outside our own bundle. Extensions inject scripts
 * into the page and their crashes surface as our errors.
 */
const DENIED_URLS: RegExp[] = [
  /^chrome:\/\//i,
  /^chrome-extension:\/\//i,
  /^moz-extension:\/\//i,
  /^safari-(web-)?extension:\/\//i,
  /^webkit-masked-url:/i,
  /extensions\//i,
  // Common injected third-party scripts.
  /googletagmanager\.com/i,
  /google-analytics\.com/i,
];

/** Matches the wording browsers use for a request that never completed. */
const NETWORK_FAILURE =
  /failed to fetch|networkerror|network request failed|load failed|aborted|econnreset|econnrefused|etimedout|fetch failed/i;

/** Matches an HTTP status that means "expected auth failure". */
const AUTH_FAILURE = /\b(401|403)\b|unauthori[sz]ed|forbidden|not authenticated/i;

function textOf(event: any): string {
  const values = event?.exception?.values ?? [];
  const fromExceptions = values
    .map((v: any) => `${v?.type ?? ''}: ${v?.value ?? ''}`)
    .join(' | ');
  const fromMessage =
    typeof event?.message === 'string'
      ? event.message
      : (event?.message?.formatted ?? '');
  return `${fromExceptions} ${fromMessage}`;
}

/**
 * A failed request to the GraphQL API. The endpoint is unreachable or the user
 * lost connectivity -- reporting it tells us nothing we can fix in this app,
 * and a backend outage would otherwise produce one issue per active user.
 */
function isGraphqlNetworkNoise(event: any): boolean {
  const text = textOf(event);
  const url = event?.request?.url ?? '';
  const touchesGraphql = /graphql/i.test(text) || /graphql/i.test(url);
  return touchesGraphql && NETWORK_FAILURE.test(text);
}

/** An expected authorization rejection rather than a genuine fault. */
function isExpectedAuthFailure(event: any): boolean {
  return AUTH_FAILURE.test(textOf(event));
}

/**
 * True when every frame we can see comes from a browser extension -- i.e. the
 * crash is in injected code, not ours.
 */
function isPureExtensionNoise(event: any): boolean {
  const frames = (event?.exception?.values ?? []).flatMap(
    (v: any) => v?.stacktrace?.frames ?? [],
  );
  if (frames.length === 0) return false;
  return frames.every((frame: any) =>
    /^(chrome|moz|safari-web|safari|webkit)-extension:\/\//i.test(
      frame?.filename ?? '',
    ),
  );
}

/**
 * This app shows student data, so no names, emails, usernames or IPs are ever
 * attached to an event. A Keystone user id is the only identifier we keep --
 * it is enough to correlate an issue with a person via the admin UI, without
 * putting PII in the error tracker.
 */
function scrubPii(event: any): void {
  if (event.user) {
    const id = event.user.id;
    if (id) {
      event.user = { id };
    } else {
      delete event.user;
    }
  }
  // `sendDefaultPii: false` already suppresses these, but a custom integration
  // or a manual `setUser` could reintroduce them.
  if (event.request?.headers) delete event.request.headers;
  if (event.request?.cookies) delete event.request.cookies;
}

/**
 * Final gate before an event becomes an issue. Returning null drops it.
 */
export function beforeSend(event: any): any {
  if (isGraphqlNetworkNoise(event)) return null;
  if (isExpectedAuthFailure(event)) return null;
  if (isPureExtensionNoise(event)) return null;

  scrubPii(event);
  return event;
}

/**
 * Options shared by every init site. Tracing is off because Bugsink cannot
 * ingest it, and there is no point paying for the traffic while we dual-track.
 */
export const sharedOptions = {
  release: RELEASE,
  environment: ENVIRONMENT,

  // Bugsink ignores tracing entirely, so this would be wasted traffic.
  tracesSampleRate: 0,

  // Never attach IPs, headers, cookies or request bodies. See scrubPii above.
  sendDefaultPii: false,

  // Set NEXT_PUBLIC_SENTRY_DEBUG=true to have the SDK log every envelope it
  // sends and the response it gets back. Needs to be set at build time as well
  // as runtime -- next.config.ts keeps the debug logging in the bundle only
  // when it is on.
  debug: process.env.NEXT_PUBLIC_SENTRY_DEBUG === 'true',

  ignoreErrors: IGNORED_ERRORS,
  denyUrls: DENIED_URLS,
  beforeSend,
};
