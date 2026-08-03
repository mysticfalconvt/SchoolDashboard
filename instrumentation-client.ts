/**
 * Browser-side error reporting.
 *
 * This file replaces the old `sentry.client.config.ts`. That file only ever ran
 * when `next.config.ts` was wrapped with `withSentryConfig` -- which it was not
 * -- so the browser SDK was not actually running before this change.
 * `instrumentation-client.ts` is the supported location in @sentry/nextjs v10
 * and is the only one that works under Turbopack.
 *
 * Errors are dual-tracked to Sentry.io and Bugsink. See lib/sentry/shared.ts.
 */
import * as Sentry from '@sentry/nextjs';

import {
  buildDestinations,
  makeDestinationMatcher,
  reportingEnabled,
  sharedOptions,
} from './lib/sentry/shared';

// Both must be NEXT_PUBLIC_-prefixed or Next will not inline them into the
// browser bundle and they will read as undefined at runtime.
const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const bugsinkDsn = process.env.NEXT_PUBLIC_BUGSINK_DSN;

const destinations = buildDestinations(sentryDsn, bugsinkDsn);
const enabled = reportingEnabled(destinations);

Sentry.init({
  ...sharedOptions,

  // The multiplexed transport overrides this per envelope, but the SDK still
  // needs a valid DSN here to consider itself configured.
  dsn: destinations[0],
  enabled,

  // Bugsink cannot ingest session replay, and replaying a session on a page
  // full of student data is not something we want stored anywhere. No replay
  // integration, no replay sample rates.
  integrations: [],

  transport: enabled
    ? Sentry.makeMultiplexedTransport(
        Sentry.makeFetchTransport,
        makeDestinationMatcher(destinations, sentryDsn),
      )
    : undefined,
});

// Exported so the SDK can instrument App Router navigations. This app is
// pages-router and tracing is disabled, so it is effectively a no-op today --
// it is here to keep the build free of the SDK's "ACTION REQUIRED" warning.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
