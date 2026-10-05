export interface PhotographerProfile {
  id: string;
  studioName: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  occupation?: string;
  bio: string;
  avatarUrl: string;
  websiteUrl?: string;
  instagramHandle?: string;
  watermarkText?: string;
  enableWatermark: boolean;
  isOnboarded: boolean;
}
