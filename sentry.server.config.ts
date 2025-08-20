import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',
  
  // Configure error filtering for server-side
  beforeSend(event, hint) {
    // Filter out known non-critical server errors
    if (event.exception) {
      const error = hint.originalException;
      
      if (error instanceof Error) {
        // Filter out common server errors that aren't actionable
        if (
          error.message.includes('ECONNRESET') ||
          error.message.includes('ENOTFOUND') ||
          error.message.includes('timeout') ||
          error.message.includes('AbortError')
        ) {
          return null;
        }
      }
    }
    
    return event;
  },
  
  // Set server context
  initialScope: {
    tags: {
      component: 'worldcoin-pooltogether-server',
    },
  },
});