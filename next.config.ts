import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

import pkg from './package.json';

/**
 * Release identifier for this build.
 *
 * This same string is inlined into the bundles below as
 * NEXT_PUBLIC_SENTRY_RELEASE and read back by lib/sentry/shared.ts at runtime,
 * so the release an event reports always matches the release the sourcemaps
 * were uploaded under.
 *
 * Set SENTRY_RELEASE in the deploy environment to get one release per deploy.
 * Without it we fall back to the package version, which does not change between
 * deploys.
 */
const release: string =
  process.env.SENTRY_RELEASE ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  `ncujhs-dashboard@${pkg.version}`;

// Sourcemaps are uploaded to Bugsink, which implements the sentry-cli upload
// endpoints. Uploading is skipped entirely unless both of these are set, so a
// fresh checkout builds without errors or credentials.
// https://www.bugsink.com/docs/sourcemaps/
const bugsinkAuthToken = process.env.BUGSINK_AUTH_TOKEN;
const bugsinkProject = process.env.BUGSINK_PROJECT;
const uploadSourcemaps = Boolean(bugsinkAuthToken && bugsinkProject);

const nextConfig: NextConfig = {
  compiler: {
    // ssr and displayName are configured by default
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  env: {
    NEXT_PUBLIC_SENTRY_RELEASE: release,
  },
};

export default withSentryConfig(nextConfig, {
  // --- Where sourcemaps go -------------------------------------------------
  // Bugsink, not Sentry.io. SENTRY_AUTH_TOKEN in .env is a Sentry.io
  // credential and will not authenticate here, so the Bugsink token is passed
  // explicitly rather than letting the plugin pick SENTRY_AUTH_TOKEN up from
  // the environment.
  sentryUrl: process.env.BUGSINK_URL || 'https://bugsink.rboskind.com',
  // Bugsink has no concept of organizations; the slug is required by the
  // upload endpoint but its value is ignored.
  org: process.env.BUGSINK_ORG || 'bugsink',
  project: bugsinkProject,
  authToken: bugsinkAuthToken,

  release: {
    name: release,
    // Bugsink implements only the sourcemap upload endpoints used by
    // sentry-cli, not Sentry's release-management API. Asking it to create or
    // finalize a release would hit endpoints it does not serve.
    create: false,
    finalize: false,
  },

  sourcemaps: {
    disable: !uploadSourcemaps,
    // Maps are uploaded and then removed from .next so they are never served
    // to browsers -- Bugsink resolves stack traces server-side using the debug
    // IDs the plugin injects into each built file.
    deleteSourcemapsAfterUpload: true,
  },

  // Upload the shared chunks too, not just page bundles. Without this, frames
  // inside vendor/framework chunks stay minified.
  widenClientFileUpload: true,

  // Do not report anything about our builds to sentry.io.
  telemetry: false,

  webpack: {
    // Sentry's build-time wrapping loader pulls in rollup, which needs a
    // platform-specific native binary. This repo's .npmrc sets
    // `optional=false`, so that binary is deliberately never installed and the
    // loader cannot run -- it fails the build with "Cannot find module
    // @rollup/rollup-linux-x64-gnu".
    //
    // We do not need it: server-side errors are already captured by the
    // `onRequestError` hook exported from instrumentation.ts (Next 15 invokes
    // it for API routes and data-fetching in the pages router) and by
    // `captureUnderscoreErrorException` in pages/_error.tsx. Build-time
    // wrapping would only add tracing spans, which Bugsink cannot ingest.
    autoInstrumentServerFunctions: false,
    autoInstrumentMiddleware: false,
    autoInstrumentAppDirectory: false,

    // Bugsink cannot ingest cron monitors.
    automaticVercelMonitors: false,

    treeshake: {
      // Strip the SDK's debug logging from the bundle, unless we are
      // deliberately debugging the reporting pipeline itself.
      removeDebugLogging: process.env.NEXT_PUBLIC_SENTRY_DEBUG !== 'true',
    },
  },

  silent: !process.env.CI,
});
