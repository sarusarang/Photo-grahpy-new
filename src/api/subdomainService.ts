import axios from 'axios';
import { authApi, publicTenantApi } from './client';
import type {
  SubdomainAvailability,
  SubdomainStatusResponse,
  TenantPortfolioData,
  ClientInquiryPayload,
} from '../types/portfolio';

export const subdomainService = {
  checkAvailability: async (name: string, signal?: AbortSignal): Promise<SubdomainAvailability> => {
    const res = await authApi.get<SubdomainAvailability>(
      `/api/portfolio/subdomain/availability/?name=${encodeURIComponent(name.trim().toLowerCase())}`,
      { signal }
    );
    return res.data;
  },

  claimSubdomain: async (subdomain: string) => {
    const res = await authApi.put('/api/portfolio/subdomain/', {
      subdomain: subdomain.trim().toLowerCase(),
    });
    return res.data;
  },

  getStatus: async (): Promise<SubdomainStatusResponse> => {
    const res = await authApi.get<SubdomainStatusResponse>('/api/portfolio/subdomain/status/');
    return res.data;
  },

  retryProvisioning: async () => {
    const res = await authApi.post('/api/portfolio/subdomain/retry/');
    return res.data;
  },
};

export const publicTenantService = {
  getPortfolioShowcase: async (): Promise<TenantPortfolioData> => {
    // When executing on a tenant host in production (e.g. mridhul.exshare.ai),
    // relative API request ensures Nginx proxies directly preserving Host
    if (
      typeof window !== 'undefined' &&
      window.location.hostname.endsWith('.exshare.ai') &&
      !window.location.hostname.startsWith('app.') &&
      !window.location.hostname.startsWith('admin.')
    ) {
      try {
        const direct = await axios.get<TenantPortfolioData>('/api/public/portfolio-site/');
        return direct.data;
      } catch (err: any) {
        if (err?.response?.status === 404) throw err;
      }
    }
    const res = await publicTenantApi.get<TenantPortfolioData>('/api/public/portfolio-site/');
    return res.data;
  },

  submitInquiry: async (
    payload: ClientInquiryPayload
  ): Promise<{ success: boolean; inquiry_id?: number | string }> => {
    if (
      typeof window !== 'undefined' &&
      window.location.hostname.endsWith('.exshare.ai') &&
      !window.location.hostname.startsWith('app.') &&
      !window.location.hostname.startsWith('admin.')
    ) {
      try {
        const direct = await axios.post('/api/public/portfolio-site/inquiries/', payload);
        return direct.data;
      } catch (err: any) {
        if (err?.response?.status) throw err;
      }
    }
    const res = await publicTenantApi.post('/api/public/portfolio-site/inquiries/', payload);
    return res.data;
  },

  trackView: async (payload: {
    page_section?: string;
    device?: 'desktop' | 'mobile' | 'tablet';
    device_type?: string;
    referrer?: string;
  }): Promise<{ success: boolean; tracked?: boolean }> => {
    if (typeof window !== 'undefined') {
      const section = payload.page_section || 'hero';
      const sessionKey = `tracked_tenant_view_${window.location.hostname}_${section}`;
      if (sessionStorage.getItem(sessionKey)) {
        return { success: true, tracked: false };
      }
      try {
        sessionStorage.setItem(sessionKey, '1');
      } catch {
        // Safe fallback in restricted environments
      }
    }
    try {
      const res = await publicTenantApi.post('/api/public/portfolio-site/track-view/', payload);
      return res.data;
    } catch {
      return { success: false };
    }
  },
};
