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
  error?: string | null;
  is_current_owner: boolean;
  status?: string;
  domain?: string;
  url?: string;
}

export interface ClaimSubdomainPayload {
  subdomain: string;
}

export interface ClaimSubdomainResponse {
  status: string;
  subdomain: string;
  domain: string;
  url: string;
  live_url?: string;
  direct_url?: string;
  message?: string;
  error?: string;
  code?: string;
}

export type ProvisioningStatus = 'pending' | 'provisioning' | 'active' | 'failed';

export interface SubdomainStatusResponse {
  subdomain: string;
  status: ProvisioningStatus;
  domain: string;
  url: string;
  live_url?: string | null;
  provisioned_at?: string;
  dns_checked_at?: string;
  error: string | null;
  retry_allowed?: boolean;
  retry_after_seconds?: number;
  retry_count?: number;
}

export interface RetrySubdomainResponse {
  status: ProvisioningStatus;
  subdomain: string;
  message: string;
  retry_after_seconds?: number;
}

export interface PublicTenantInquiryPayload {
  client_name: string;
  client_email: string;
  client_phone?: string;
  event_type?: string;
  event_date?: string;
  event_location?: string;
  location?: string;
  estimated_budget?: string;
  budget?: string;
  message: string;
}

export interface PublicTenantInquiryResponse {
  success?: boolean;
  status?: string;
  message?: string;
  inquiry_id?: number | string;
}

