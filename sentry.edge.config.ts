import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',
  
  // Configure error filtering for edge runtime
  beforeSend(event, hint) {
    // Filter out known non-critical edge errors
    if (event.exception) {
      const error = hint.originalException;
      
      if (error instanceof Error) {
        // Filter out edge-specific errors that aren't actionable
        if (
          error.message.includes('Dynamic Code Evaluation') ||
          error.message.includes('Edge Runtime')
        ) {
          return null;
        }
      }
    }
    
    return event;
  },
  
  // Set edge context
  initialScope: {
    tags: {
      component: 'worldcoin-pooltogether-edge',
    },
  },
});