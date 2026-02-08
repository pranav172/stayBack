// Sentry client-side configuration
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',
  
  // Performance monitoring - sample 10% of transactions
  tracesSampleRate: 0.1,
  
  // Session replay for debugging user issues
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Filter out noisy errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    // Network errors
    'Network request failed',
    'Failed to fetch',
    // Firebase specific
    'PERMISSION_DENIED',
    'DISCONNECTED',
  ],
  
  // Add useful context while maintaining privacy
  beforeSend(event) {
    // Don't expose anonymous user IDs
    const userId = event.user?.id;
    if (typeof userId === 'string' && userId.startsWith('anon_')) {
      delete event.user?.id;
    }
    return event;
  },
});
