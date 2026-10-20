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
  const clean = encodeURIComponent((slugOrId || '').trim().toLowerCase());
  try {
    return await CommonApi<PortfolioConfig>('GET', `/api/public/portfolios/${clean}/`);
  } catch (err: any) {
    if (err?.response?.status === 404) {
      return CommonApi<PortfolioConfig>('GET', `/api/public/portfolio/${clean}/`);
    }
    throw err;
  }
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
  if (typeof window !== 'undefined') {
    const sessionKey = `tracked_view_${slugOrId}_${payload.page_section || 'hero'}`;
    if (sessionStorage.getItem(sessionKey)) {
      return { success: true };
    }
    try {
      sessionStorage.setItem(sessionKey, '1');
    } catch {
      // ignore
    }
  }

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
 * 9a. Check DNS Provisioning Status
 * Endpoint: GET /api/portfolio/subdomain/status/
 */
export const GetSubdomainStatusApi = async (): Promise<import('./type').SubdomainStatusResponse> => {
  return CommonApi('GET', '/api/portfolio/subdomain/status/');
};

/**
 * 9b. Retry DNS Provisioning
 * Endpoint: POST /api/portfolio/subdomain/retry/
 */
export const RetrySubdomainProvisioningApi = async (): Promise<import('./type').RetrySubdomainResponse> => {
  return CommonApi('POST', '/api/portfolio/subdomain/retry/');
};

/**
 * 10. Retrieve Public Portfolio Resolved from Host / Subdomain
 * Endpoint: GET /api/public/portfolio-site/
 */
export const GetPublicTenantPortfolioApi = async (
  subdomain?: string
): Promise<PortfolioConfig> => {
  const isTenantHost =
    typeof window !== 'undefined' &&
    window.location.hostname.endsWith('.exshare.ai') &&
    !window.location.hostname.startsWith('app.') &&
    !window.location.hostname.startsWith('admin.');

  if (isTenantHost) {
    try {
      const response = await import('axios').then(m => m.default.get('/api/public/portfolio-site/'));
      return response.data as PortfolioConfig;
    } catch (err: any) {
      if (err?.response?.status === 404) throw err;
      // Fallback below if proxy routing error
    }
  }

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
  const isTenantHost =
    typeof window !== 'undefined' &&
    window.location.hostname.endsWith('.exshare.ai') &&
    !window.location.hostname.startsWith('app.') &&
    !window.location.hostname.startsWith('admin.');

  if (isTenantHost) {
    try {
      const response = await import('axios').then(m => m.default.post('/api/public/portfolio-site/inquiries/', payload));
      return response.data as import('./type').PublicTenantInquiryResponse;
    } catch (err: any) {
      if (err?.response?.status) throw err;
    }
  }

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
  if (typeof window !== 'undefined') {
    const sessionKey = `tracked_tenant_view_${subdomain || window.location.hostname}_${payload.page_section || 'hero'}`;
    if (sessionStorage.getItem(sessionKey)) {
      return { success: true, tracked: false };
    }
    try {
      sessionStorage.setItem(sessionKey, '1');
    } catch {
      // ignore
    }
  }

  const isTenantHost =
    typeof window !== 'undefined' &&
    window.location.hostname.endsWith('.exshare.ai') &&
    !window.location.hostname.startsWith('app.') &&
    !window.location.hostname.startsWith('admin.');

  if (isTenantHost) {
    try {
      const response = await import('axios').then(m => m.default.post('/api/public/portfolio-site/track-view/', payload));
      return response.data;
    } catch {
      // Silently fall through
    }
  }

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


