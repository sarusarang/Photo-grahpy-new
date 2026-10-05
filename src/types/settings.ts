export interface TutorialStep {
  id: number;
  title: string;
  shortDesc: string;
  details: string;
  iconName: string;
  videoThumbUrl: string;
  videoDuration: string;
  keyPoints: string[];
  actionLabel?: string;
  actionRoute?: string;
}

export interface NotificationSettings {
  clientVisited: boolean;
  photosDownloaded: boolean;
  favoritesSelected: boolean;
  storageAlerts: boolean;
  marketingUpdates: boolean;
}
