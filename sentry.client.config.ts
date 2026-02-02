// sentry.client.config.ts
// This file configures Sentry on the browser (client side)
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV !== "production",

  // Enable replay only in production
  replaysOnErrorSampleRate:
    process.env.NODE_ENV === "production" ? 1.0 : 0,

  // Capture 10% of all sessions in production
  replaysSessionSampleRate:
    process.env.NODE_ENV === "production" ? 0.1 : 0,

  // Integrations for enhanced error tracking
  integrations: [
    Sentry.replayIntegration({
      // Mask all text and block all media by default for privacy
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.browserTracingIntegration(),
  ],

  // Filter out certain errors
  ignoreErrors: [
    // Browser extensions
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    // Network errors (user connectivity issues)
    "Failed to fetch",
    "NetworkError",
    "Load failed",
  ],

  // Sanitize sensitive data before sending to Sentry
  beforeSend(event) {
    // Remove any PII from the event
    if (event.request?.headers) {
      delete event.request.headers["Authorization"];
      delete event.request.headers["Cookie"];
    }
    return event;
  },

  // Set environment
  environment: process.env.NODE_ENV || "development",
});
