// -------------------------------------------------------------
// Studio Portfolio API Types
// -------------------------------------------------------------

export interface DeletePortfolioProjectResponse {
  success: boolean;
  message?: string;
}

export interface PortfolioAnalyticsResponse {
  total_visitors: number;
  inquiry_conversion: number;
  top_viewed_projects: Array<{ id: string; title: string; views: number }>;
}
