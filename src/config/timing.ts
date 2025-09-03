// Timing configuration for the application
// All values should be configurable via environment variables

// Get draw interval from environment variables (in minutes)
const DRAW_INTERVAL_MINUTES = parseInt(process.env.NEXT_PUBLIC_DRAW_INTERVAL_MINUTES || '5');

// Convert to different time units
export const DRAW_INTERVAL = {
  MINUTES: DRAW_INTERVAL_MINUTES,
  SECONDS: DRAW_INTERVAL_MINUTES * 60,
  MILLISECONDS: DRAW_INTERVAL_MINUTES * 60 * 1000,
};

// UI update intervals
export const UPDATE_INTERVALS = {
  COUNTDOWN: parseInt(process.env.NEXT_PUBLIC_COUNTDOWN_UPDATE_INTERVAL || '1000'), // 1 second
  PRIZE_POOL: parseInt(process.env.NEXT_PUBLIC_PRIZE_POOL_UPDATE_INTERVAL || '5000'), // 5 seconds
  PERFORMANCE_MONITOR: parseInt(process.env.NEXT_PUBLIC_PERFORMANCE_UPDATE_INTERVAL || '2000'), // 2 seconds
  DEBUG_LOGS: parseInt(process.env.NEXT_PUBLIC_DEBUG_LOG_INTERVAL || '1000'), // 1 second
};

// Auto-draw configuration
export const AUTO_DRAW_CONFIG = {
  ENABLED: process.env.NEXT_PUBLIC_AUTO_DRAW_ENABLED === 'true',
  FREQUENT_WINS: process.env.NEXT_PUBLIC_ENABLE_FREQUENT_WINS === 'true',
};

// Notification timing
export const NOTIFICATION_TIMING = {
  WINNER_DISPLAY_DURATION: parseInt(process.env.NEXT_PUBLIC_WINNER_NOTIFICATION_DURATION || '10000'), // 10 seconds
  TOAST_DURATION: parseInt(process.env.NEXT_PUBLIC_TOAST_DURATION || '5000'), // 5 seconds
};

// Animation and transition timing
export const ANIMATION_TIMING = {
  DRAW_SIMULATION: parseInt(process.env.NEXT_PUBLIC_DRAW_ANIMATION_DURATION || '3000'), // 3 seconds
  FADE_TRANSITION: parseInt(process.env.NEXT_PUBLIC_FADE_DURATION || '300'), // 300ms
  BOUNCE_ANIMATION: parseInt(process.env.NEXT_PUBLIC_BOUNCE_DURATION || '500'), // 500ms
};

// Helper functions
export const formatTimeRemaining = (milliseconds: number): string => {
  if (milliseconds <= 0) return 'Draw in progress...';
  
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
};

export const getDrawIntervalDisplay = (): string => {
  if (DRAW_INTERVAL.MINUTES < 60) {
    return `${DRAW_INTERVAL.MINUTES} minute${DRAW_INTERVAL.MINUTES !== 1 ? 's' : ''}`;
  } else {
    const hours = Math.floor(DRAW_INTERVAL.MINUTES / 60);
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
};

// Export configuration object for easy access
export const TIMING_CONFIG = {
  DRAW_INTERVAL,
  UPDATE_INTERVALS,
  AUTO_DRAW_CONFIG,
  NOTIFICATION_TIMING,
  ANIMATION_TIMING,
} as const;

export default TIMING_CONFIG;