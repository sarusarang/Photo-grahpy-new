/**
 * EX SHARE ATELIER — Guest Identity & Creator Profile Utility
 * Manages client/guest identity in public galleries so each visitor can have their
 * customized video stories, reels, and favorites tracked and saved individually.
 */

export interface GuestProfile {
  guestId: string;
  name: string;
  email?: string;
  phone?: string;
  createdAt: number;
}

const STORAGE_KEY = 'ex_share_gallery_guest_profile';

/**
 * Retrieves the stored guest profile from localStorage or generates a default guest identity.
 */
export function getStoredGuestProfile(): GuestProfile {
  if (typeof window === 'undefined') {
    return {
      guestId: 'guest_ssr',
      name: 'Guest Creator',
      createdAt: Date.now(),
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.guestId) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[GuestIdentity] Failed to read from localStorage:', err);
  }

  // Generate anonymous unique guest ID
  const newProfile: GuestProfile = {
    guestId: `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name: 'Guest Creator',
    createdAt: Date.now(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
  } catch (err) {
    console.warn('[GuestIdentity] Storage unavailable:', err);
  }

  return newProfile;
}

/**
 * Updates the guest profile with user's name, email, or phone.
 */
export function saveGuestProfile(profile: Partial<GuestProfile>): GuestProfile {
  const current = getStoredGuestProfile();
  const updated: GuestProfile = {
    ...current,
    ...profile,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('[GuestIdentity] Failed to save profile:', err);
  }

  return updated;
}
