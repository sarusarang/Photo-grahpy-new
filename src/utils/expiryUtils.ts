export type ExpiryPresetId =
  | '24h'
  | '48h'
  | '7d'
  | '14d'
  | '30d'
  | '60d'
  | '90d'
  | 'custom'
  | 'never';

export interface ExpiryPreset {
  id: ExpiryPresetId;
  label: string;
  durationMs?: number;
}

export const EXPIRY_PRESETS: ExpiryPreset[] = [
  { id: '24h', label: '24 Hours', durationMs: 24 * 60 * 60 * 1000 },
  { id: '48h', label: '48 Hours', durationMs: 48 * 60 * 60 * 1000 },
  { id: '7d', label: '7 Days', durationMs: 7 * 24 * 60 * 60 * 1000 },
  { id: '14d', label: '14 Days', durationMs: 14 * 24 * 60 * 60 * 1000 },
  { id: '30d', label: '30 Days', durationMs: 30 * 24 * 60 * 60 * 1000 },
  { id: '90d', label: '90 Days', durationMs: 90 * 24 * 60 * 60 * 1000 },
  { id: 'never', label: 'No Expiry (Always Active)' },
  { id: 'custom', label: 'Custom Date & Time' },
];

export interface ExpiryStatus {
  isExpired: boolean;
  hasExpiry: boolean;
  daysRemaining: number;
  hoursRemaining: number;
  minutesRemaining: number;
  humanFormatted: string;
  remainingText: string;
  isExpiringSoon: boolean; // Less than 48 hours remaining
}

/**
 * Checks whether an expiration ISO string or date has passed
 */
export function isGalleryExpired(expiresAt?: string): boolean {
  if (!expiresAt || expiresAt.trim() === '') return false;
  const expiryDate = new Date(expiresAt);
  if (isNaN(expiryDate.getTime())) return false;
  return Date.now() > expiryDate.getTime();
}

/**
 * Parses and computes detailed expiry status, countdown, and human-readable text
 */
export function getExpiryStatus(expiresAt?: string): ExpiryStatus {
  if (!expiresAt || expiresAt.trim() === '') {
    return {
      isExpired: false,
      hasExpiry: false,
      daysRemaining: Infinity,
      hoursRemaining: Infinity,
      minutesRemaining: Infinity,
      humanFormatted: 'Permanent Access (No Expiry)',
      remainingText: 'Never Expires',
      isExpiringSoon: false,
    };
  }

  const targetDate = new Date(expiresAt);
  if (isNaN(targetDate.getTime())) {
    return {
      isExpired: false,
      hasExpiry: false,
      daysRemaining: Infinity,
      hoursRemaining: Infinity,
      minutesRemaining: Infinity,
      humanFormatted: 'Permanent Access (No Expiry)',
      remainingText: 'Never Expires',
      isExpiringSoon: false,
    };
  }

  const now = Date.now();
  const diffMs = targetDate.getTime() - now;
  const isExpired = diffMs <= 0;

  const absDiff = Math.abs(diffMs);
  const totalMinutes = Math.floor(absDiff / (60 * 1000));
  const totalHours = Math.floor(absDiff / (60 * 60 * 1000));
  const daysRemaining = Math.floor(absDiff / (24 * 60 * 60 * 1000));
  const hoursRemaining = totalHours % 24;
  const minutesRemaining = totalMinutes % 60;

  // Format date nicely (e.g. "Nov 24, 2026, 6:00 PM")
  const humanFormatted = targetDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  let remainingText = '';
  if (isExpired) {
    if (daysRemaining > 0) {
      remainingText = `Expired ${daysRemaining} day${daysRemaining > 1 ? 's' : ''} ago`;
    } else if (totalHours > 0) {
      remainingText = `Expired ${totalHours} hour${totalHours > 1 ? 's' : ''} ago`;
    } else {
      remainingText = `Expired just now`;
    }
  } else {
    if (daysRemaining > 0) {
      remainingText = `${daysRemaining}d ${hoursRemaining}h remaining`;
    } else if (hoursRemaining > 0) {
      remainingText = `${hoursRemaining}h ${minutesRemaining}m remaining`;
    } else {
      remainingText = `${minutesRemaining}m remaining`;
    }
  }

  return {
    isExpired,
    hasExpiry: true,
    daysRemaining: isExpired ? 0 : daysRemaining,
    hoursRemaining: isExpired ? 0 : hoursRemaining,
    minutesRemaining: isExpired ? 0 : minutesRemaining,
    humanFormatted,
    remainingText,
    isExpiringSoon: !isExpired && diffMs < 48 * 60 * 60 * 1000,
  };
}

/**
 * Calculates a new ISO string given a preset or custom date
 */
export function calculateExpiryPreset(
  presetId: ExpiryPresetId,
  customDateIso?: string
): string | undefined {
  if (presetId === 'never') return undefined;

  if (presetId === 'custom') {
    return customDateIso || undefined;
  }

  const preset = EXPIRY_PRESETS.find((p) => p.id === presetId);
  if (!preset || !preset.durationMs) return undefined;

  return new Date(Date.now() + preset.durationMs).toISOString();
}

/**
 * Extends an existing or expired date by a number of days
 */
export function extendExpiryByDays(days: number, fromDateIso?: string): string {
  const baseTime = fromDateIso && !isGalleryExpired(fromDateIso)
    ? new Date(fromDateIso).getTime()
    : Date.now();

  return new Date(baseTime + days * 24 * 60 * 60 * 1000).toISOString();
}
