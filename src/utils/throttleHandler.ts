import type { AxiosError } from 'axios';
import { toast } from 'sonner';

export interface ThrottleDetail {
  seconds: number;
  url?: string;
  message: string;
}

/**
 * Global HTTP 429 (Too Many Requests / Throttling) Handler.
 * Extracts Retry-After from headers or body, alerts user with a single toast,
 * and emits a window 'api-throttled' event for countdown timers.
 */
export function handleAxiosThrottleError(error: AxiosError<{ detail?: string; message?: string }>): boolean {
  if (error.response?.status === 429) {
    const headers = error.response.headers || {};
    const retryAfterHeader = headers['retry-after'] || headers['Retry-After'];
    let seconds: number | null = retryAfterHeader ? parseInt(String(retryAfterHeader), 10) : null;

    const detailText = error.response.data?.detail || error.response.data?.message;
    if (!seconds && detailText && typeof detailText === 'string') {
      const match = detailText.match(/(\d+)\s*seconds?/i);
      if (match) {
        seconds = parseInt(match[1], 10);
      }
    }

    const waitSeconds = seconds && !isNaN(seconds) ? seconds : 30;

    const waitMessage = seconds
      ? `Too many attempts. Please wait ${seconds}s before trying again.`
      : 'Too many requests. Please wait a moment before trying again.';

    toast.error(waitMessage, {
      id: 'throttle-rate-limit-toast',
      duration: Math.min(waitSeconds * 1000, 15000),
      description: 'Request rate limit exceeded.',
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('api-throttled', {
          detail: {
            seconds: waitSeconds,
            url: error.config?.url,
            message: waitMessage,
          },
        })
      );
    }

    return true;
  }
  return false;
}
