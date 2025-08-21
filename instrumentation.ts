import * as Sentry from '@sentry/nextjs';

export function register() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 1,
    enabled: process.env.NODE_ENV === 'production',

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    replaysOnErrorSampleRate: 1.0,

    // This sets the sample rate to be 10%. You may want this to be 100% while
    // in development and sample at a lower rate in production
    replaysSessionSampleRate: 0.1,

    // Remove replay integration for now - it seems to have compatibility issues
    // integrations: [
    //   replayIntegration({
    //     // Additional Replay configuration goes in here, for example:
    //     maskAllText: true,
    //     blockAllMedia: true,
    //   }),
    // ],
  });
}

export const onRequestError = Sentry.captureRequestError;
