import { CommonApi } from '@/lib/CommonApi';
import type { PortfolioConfig, PortfolioProject } from '@/types/atelier';
import type {
  DeletePortfolioProjectResponse,
  PortfolioAnalyticsResponse,
  TrackPortfolioViewPayload,
  TrackPortfolioViewResponse,
} from './type';

export * from './type';

/**
 * 1. Retrieve Photographer Portfolio Configuration
 * Endpoint: GET /api/portfolio/config/
 */
export const GetPortfolioConfigApi = async (): Promise<PortfolioConfig> => {
  return CommonApi<PortfolioConfig>('GET', '/api/portfolio/config/');
};

/**
 * 2. Update Portfolio Branding & Template
 * Endpoint: PATCH /api/portfolio/config/
 */
export const UpdatePortfolioConfigApi = async (
  payload: Partial<PortfolioConfig>
): Promise<PortfolioConfig> => {
  return CommonApi<PortfolioConfig>('PATCH', '/api/portfolio/config/', payload);
};

/**
 * 3. Add Showcase Project to Portfolio
 * Endpoint: POST /api/portfolio/projects/
 */
export const AddPortfolioProjectApi = async (
  project: Partial<PortfolioProject>
): Promise<PortfolioProject> => {
  return CommonApi<PortfolioProject>('POST', '/api/portfolio/projects/', project);
};

/**
 * 4. Remove Showcase Project
 * Endpoint: DELETE /api/portfolio/projects/{id}/
 */
export const DeletePortfolioProjectApi = async (
  projectId: string
): Promise<DeletePortfolioProjectResponse> => {
  return CommonApi('DELETE', `/api/portfolio/projects/${projectId}/`);
};

/**
 * 5. Retrieve Public Portfolio Showcase
 * Endpoint: GET /api/public/portfolio/{photographer_slug}/
 */
export const GetPublicPortfolioApi = async (
  slugOrId: string
): Promise<PortfolioConfig> => {
  return CommonApi<PortfolioConfig>('GET', `/api/public/portfolio/${slugOrId}/`);
};

/**
 * 6. Retrieve Portfolio Analytics
 * Endpoint: GET /api/portfolio/analytics/
 */
export const GetPortfolioAnalyticsApi = async (): Promise<PortfolioAnalyticsResponse> => {
  return CommonApi('GET', '/api/portfolio/analytics/');
};

/**
 * 7. Track Public Portfolio View & Project Engagement
 * Primary: POST /api/public/portfolio/{slugOrId}/track-view/
 * Fallback: POST /api/portfolio/track-view/
 */
export const TrackPortfolioViewApi = async (
  slugOrId: string,
  payload: TrackPortfolioViewPayload = {}
): Promise<TrackPortfolioViewResponse> => {
  const device =
    payload.device ||
    (typeof window !== 'undefined'
      ? /Mobi|Android/i.test(navigator.userAgent)
        ? 'mobile'
        : /iPad|Tablet/i.test(navigator.userAgent)
        ? 'tablet'
        : 'desktop'
      : 'desktop');
  const referrer =
    payload.referrer ||
    (typeof document !== 'undefined' ? document.referrer || 'direct' : 'direct');

  const body = {
    ...payload,
    photographer_slug: slugOrId,
    device,
    referrer,
  };

  try {
    return await CommonApi('POST', `/api/public/portfolio/${slugOrId}/track-view/`, body);
  } catch {
    try {
      return await CommonApi('POST', '/api/portfolio/track-view/', body);
    } catch {
      // Silently catch if backend is still spinning up
      return { success: false };
    }
  }
};

/**
 * 8. Live Subdomain Availability Check
 * Endpoint: GET /api/portfolio/subdomain/availability/?name={name}
 */
export const CheckSubdomainAvailabilityApi = async (
  name: string,
  signal?: AbortSignal
): Promise<import('./type').SubdomainAvailabilityResponse> => {
  return CommonApi(
    'GET',
    '/api/portfolio/subdomain/availability/',
    { name: name.trim().toLowerCase() },
    { signal }
  );
};

/**
 * 9. Atomically Claim Subdomain
 * Endpoint: PUT /api/portfolio/subdomain/
 */
export const ClaimSubdomainApi = async (
  subdomain: string
): Promise<import('./type').ClaimSubdomainResponse> => {
  return CommonApi('PUT', '/api/portfolio/subdomain/', {
    subdomain: subdomain.trim().toLowerCase(),
  });
};

/**
 * 10. Retrieve Public Portfolio Resolved from Host / Subdomain
 * Endpoint: GET /api/public/portfolio-site/
 */
export const GetPublicTenantPortfolioApi = async (
  subdomain?: string
): Promise<PortfolioConfig> => {
  const headers: Record<string, string> = {};
  if (subdomain) {
    headers['X-Tenant-Subdomain'] = subdomain;
  }
  if (typeof window !== 'undefined' && window.location?.host) {
    headers['X-Forwarded-Host'] = window.location.host;
  }

  const params: Record<string, string> = {};
  if (subdomain) {
    params.subdomain = subdomain;
  }

  return CommonApi<PortfolioConfig>(
    'GET',
    '/api/public/portfolio-site/',
    params,
    { headers }
  );
};

/**
 * 11. Submit Public Client Inquiry on Tenant Portfolio
 * Endpoint: POST /api/public/portfolio-site/inquiries/
 */
export const SubmitPublicTenantInquiryApi = async (
  payload: import('./type').PublicTenantInquiryPayload,
  subdomain?: string
): Promise<import('./type').PublicTenantInquiryResponse> => {
  const headers: Record<string, string> = {};
  if (subdomain) {
    headers['X-Tenant-Subdomain'] = subdomain;
  }
  if (typeof window !== 'undefined' && window.location?.host) {
    headers['X-Forwarded-Host'] = window.location.host;
  }

  return CommonApi('POST', '/api/public/portfolio-site/inquiries/', payload, { headers });
};

/**
 * 12. Record Visitor Telemetry on Tenant Portfolio
 * Endpoint: POST /api/public/portfolio-site/track-view/
 */
export const TrackPublicTenantViewApi = async (
  payload: { page_section?: string; device?: 'desktop' | 'mobile' | 'tablet' },
  subdomain?: string
): Promise<{ success: boolean; tracked?: boolean }> => {
  const headers: Record<string, string> = {};
  if (subdomain) {
    headers['X-Tenant-Subdomain'] = subdomain;
  }
  if (typeof window !== 'undefined' && window.location?.host) {
    headers['X-Forwarded-Host'] = window.location.host;
  }

  try {
    return await CommonApi('POST', '/api/public/portfolio-site/track-view/', payload, { headers });
  } catch {
    return { success: false };
  }
};

