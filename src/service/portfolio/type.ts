// -------------------------------------------------------------
// Studio Portfolio API Types
// -------------------------------------------------------------

export interface DeletePortfolioProjectResponse {
  success: boolean;
  message?: string;
}

export interface PortfolioAnalyticsResponse {
  total_visitors: number;
  total_views?: number;
  inquiry_conversion: number;
  conversion_rate?: number;
  avg_engagement_duration?: string;
  views_by_device?: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  top_viewed_projects: Array<{
    id: string;
    title: string;
    category?: string;
    views: number;
    inquiries_generated?: number;
  }>;
  chart_points?: number[];
  chart_labels?: string[];
  recent_visitors?: Array<{
    id: string;
    city?: string;
    country?: string;
    time?: string;
    device?: string;
    page?: string;
  }>;
}

export interface TrackPortfolioViewPayload {
  project_id?: string;
  project_title?: string;
  page_section?: string;
  device?: 'desktop' | 'mobile' | 'tablet';
  referrer?: string;
}

export interface TrackPortfolioViewResponse {
  success: boolean;
}

export interface SubdomainAvailabilityResponse {
  name: string;
  available: boolean;
  reason: string | null;
  is_current_owner: boolean;
}

export interface ClaimSubdomainPayload {
  subdomain: string;
}

export interface ClaimSubdomainResponse {
  status: string;
  subdomain: string;
  domain: string;
  url: string;
}

export interface PublicTenantInquiryPayload {
  client_name: string;
  client_email: string;
  client_phone?: string;
  event_type?: string;
  event_date?: string;
  location?: string;
  budget?: string;
  message: string;
}

export interface PublicTenantInquiryResponse {
  success: boolean;
  inquiry_id?: number | string;
}

