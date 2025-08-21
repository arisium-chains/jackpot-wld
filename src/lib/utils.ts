import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Extend Window interface for MiniKit
declare global {
  interface Window {
    MiniKit?: {
      walletAddress?: string;
      [key: string]: unknown;
    };
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Check if the app is running inside World App
 * @returns true if MiniKit is available, false otherwise
 */
export const isWorldApp = () => 
  typeof window !== 'undefined' && !!window.MiniKit
