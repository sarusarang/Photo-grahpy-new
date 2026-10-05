/**
 * Curated high-resolution banners and date helpers for Live Events.
 */

export const CURATED_EVENT_BANNERS = [
  {
    id: 'banner-palace',
    name: 'Royal Palace Editorial',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=85',
    category: 'Wedding & Editorial',
  },
  {
    id: 'banner-fashion',
    name: 'Haute Couture Vogue',
    url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1800&q=85',
    category: 'Fashion & Gala',
  },
  {
    id: 'banner-botanical',
    name: 'Lake Como Botanical',
    url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1800&q=85',
    category: 'Outdoor & Romantic',
  },
  {
    id: 'banner-sunset',
    name: 'Amalfi Sunset Warmth',
    url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1800&q=85',
    category: 'Warm & Intimate',
  },
  {
    id: 'banner-minimal',
    name: 'Scandinavian Modern Minimal',
    url: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1800&q=85',
    category: 'Minimal & Art',
  },
  {
    id: 'banner-noir',
    name: 'Darkroom Noir Cinema',
    url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1800&q=85',
    category: 'Moody & Cinematic',
  },
];

export const getExpiryDateHoursAhead = (hours: number): string => {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d.toISOString();
};
