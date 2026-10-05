import type { PortfolioInquiry, InquiryStatus } from '@/types/atelier';

// -------------------------------------------------------------
// Studio Inquiries & Client Leads API Types
// -------------------------------------------------------------

export interface InquiriesListResponse {
  total_inquiries: number;
  accessible_inquiries: number;
  has_full_inquiry_access: boolean;
  upgrade_prompt?: string;
  inquiries: PortfolioInquiry[];
}

export interface SubmitInquiryPayload {
  photographer_id?: string | number;
  client_name: string;
  client_email: string;
  client_phone: string;
  event_type: string;
  event_date: string;
  location: string;
  budget: string;
  message: string;
}

export interface SubmitInquiryResponse {
  success: boolean;
  message: string;
  inquiry_id?: string;
}

export interface DeleteInquiryResponse {
  success: boolean;
  message?: string;
}

export interface InquiriesAnalyticsResponse {
  total_pipeline_value: string;
  conversion_rate: number;
  status_counts: Record<InquiryStatus, number>;
}
