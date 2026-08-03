/**
 * Server-side error reporting.
 *
 * Next 15 runs this file natively via the instrumentation hook. The old
 * `sentry.server.config.ts` was only ever loaded by the Sentry webpack plugin,
 * and `next.config.ts` was not wrapped with `withSentryConfig`, so that file
 * was dead code -- its options never applied. It has been deleted and its
 * config folded in here, which is the single server init site.
 *
 * Errors are dual-tracked to Sentry.io and Bugsink. See lib/sentry/shared.ts.
 */
import { makeMultiplexedTransport } from '@sentry/core';
import * as Sentry from '@sentry/nextjs';

import {
  buildDestinations,
  makeDestinationMatcher,
  reportingEnabled,
  sharedOptions,
} from './lib/sentry/shared';

export function register() {
  // The Node transport only exists on the Node runtime. This app has no
  // edge-runtime routes; if any are added they need their own init here.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  // Server env vars need no NEXT_PUBLIC_ prefix. We fall back to the public
  // ones so a deploy that only sets the NEXT_PUBLIC_ pair still reports.
  const sentryDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  const bugsinkDsn =
    process.env.BUGSINK_DSN || process.env.NEXT_PUBLIC_BUGSINK_DSN;

  const destinations = buildDestinations(sentryDsn, bugsinkDsn);
  const enabled = reportingEnabled(destinations);

  Sentry.init({
    ...sharedOptions,

    // Overridden per envelope by the multiplexed transport, but the SDK still
    // needs a valid DSN here to consider itself configured.
    dsn: destinations[0],
    enabled,

    transport: enabled
      ? makeMultiplexedTransport(
          Sentry.makeNodeTransport,
          makeDestinationMatcher(destinations, sentryDsn),
        )
      : undefined,
  });
}

export const onRequestError = Sentry.captureRequestError;
