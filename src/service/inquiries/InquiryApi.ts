import { CommonApi } from '@/lib/CommonApi';
import type { PortfolioInquiry, InquiryStatus } from '@/types/atelier';

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

/**
 * 1. Retrieve Inquiries List (with automatic tier-gated masking)
 * Endpoint: GET /api/inquiries/
 */
export const GetInquiriesApi = async (): Promise<InquiriesListResponse> => {
  const res = await CommonApi<InquiriesListResponse | PortfolioInquiry[]>('GET', '/api/inquiries/');
  if (Array.isArray(res)) {
    return {
      total_inquiries: res.length,
      accessible_inquiries: res.length,
      has_full_inquiry_access: true,
      inquiries: res,
    };
  }
  return res;
};

/**
 * 2. Update Lead Pipeline Status
 * Endpoint: PATCH /api/inquiries/{id}/
 */
export const UpdateInquiryStatusApi = async (
  inquiryId: string,
  status: InquiryStatus,
  notes?: string
): Promise<PortfolioInquiry> => {
  return CommonApi<PortfolioInquiry>('PATCH', `/api/inquiries/${inquiryId}/`, { status, notes });
};

/**
 * 3. Delete Inquiry
 * Endpoint: DELETE /api/inquiries/{id}/
 */
export const DeleteInquiryApi = async (inquiryId: string): Promise<{ success: boolean; message?: string }> => {
  return CommonApi('DELETE', `/api/inquiries/${inquiryId}/`);
};

/**
 * 4. Submit Public Client Inquiry from Portfolio
 * Endpoint: POST /api/public/inquiries/
 */
export const SubmitPublicInquiryApi = async (
  payload: SubmitInquiryPayload
): Promise<{ success: boolean; message: string; inquiry_id?: string }> => {
  return CommonApi('POST', '/api/public/inquiries/', payload);
};

/**
 * 5. Retrieve Inquiries Pipeline Analytics
 * Endpoint: GET /api/inquiries/analytics/
 */
export const GetInquiriesAnalyticsApi = async (): Promise<{
  total_pipeline_value: string;
  conversion_rate: number;
  status_counts: Record<InquiryStatus, number>;
}> => {
  return CommonApi('GET', '/api/inquiries/analytics/');
};
