// services/portfolioApi.ts
import axios from 'axios';
import type {
  SubdomainAvailabilityResponse,
  ClaimSubdomainResponse,
  PortfolioConfig,
} from '../types/portfolio';

const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_API_BASE_URL || import.meta.env?.VITE_API_URL)) ||
  'https://server.exshare.ai';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  // If no auth header was set and token exists in localStorage, attach it
  if (!config.headers.Authorization && typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization =
        token.startsWith('Bearer ') || token.startsWith('Token ')
          ? token
          : `Bearer ${token}`;
    }
  }
  return config;
});

/**
 * 1. Debounced Availability Check
 * Checks if requested subdomain is valid, unreserved, and available in DB.
 */
export async function checkSubdomainAvailability(
  subdomain: string,
  token?: string
): Promise<SubdomainAvailabilityResponse> {
  const clean = subdomain.trim().toLowerCase();
  const headers = token ? { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` } : {};

  const response = await apiClient.get<SubdomainAvailabilityResponse>(
    `/api/portfolio/subdomain/availability/`,
    {
      params: { subdomain: clean, name: clean },
      headers,
    }
  );
  return response.data;
}

/**
 * 2. Claim Subdomain
 * Concurrency-safe atomic reservation with immediate wildcard activation.
 */
export async function claimSubdomain(
  subdomain: string,
  token?: string
): Promise<ClaimSubdomainResponse> {
  const clean = subdomain.trim().toLowerCase();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  const response = await apiClient.post<ClaimSubdomainResponse>(
    `/api/portfolio/subdomain/`,
    { subdomain: clean },
    {
      headers,
    }
  );
  return response.data;
}

/**
 * 3. Update Portfolio Studio Settings (Branding, Template, Publishing)
 */
export async function updatePortfolioConfig(
  payload: Partial<PortfolioConfig>,
  token?: string
): Promise<PortfolioConfig> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  const response = await apiClient.patch<PortfolioConfig>(
    `/api/portfolio/config/`,
    payload,
    {
      headers,
    }
  );
  return response.data;
}

/**
 * 4. Fetch Public Portfolio by Subdomain or Username (Path-Based)
 * Use when routing inside the main app e.g., exshare.ai/p/mrudul
 */
export async function fetchPublicPortfolio(
  identifier: string
): Promise<PortfolioConfig> {
  const clean = encodeURIComponent(identifier.trim().toLowerCase());
  try {
    const response = await apiClient.get<PortfolioConfig>(
      `/api/public/portfolios/${clean}/`
    );
    return response.data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      // Fallback to singular endpoint if plural 404s
      try {
        const fallback = await apiClient.get<PortfolioConfig>(
          `/api/public/portfolio/${clean}/`
        );
        return fallback.data;
      } catch {
        throw err;
      }
    }
    throw err;
  }
}

/**
 * 5. Fetch Tenant Portfolio (Host / Wildcard Domain Resolution)
 * Use when rendering visitor traffic at https://mrudul.exshare.ai
 */
export async function fetchTenantPortfolioSite(
  overrideSubdomain?: string
): Promise<PortfolioConfig> {
  const headers: Record<string, string> = {};
  if (overrideSubdomain) {
    headers['X-Tenant-Subdomain'] = overrideSubdomain;
  } else if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    if (host.endsWith('.exshare.ai') && !host.startsWith('www.') && !host.startsWith('app.')) {
      const sub = host.replace('.exshare.ai', '').split(':')[0];
      if (sub) headers['X-Tenant-Subdomain'] = sub;
    }
  }

  const response = await apiClient.get<PortfolioConfig>(
    `/api/public/portfolio-site/`,
    { headers }
  );
  return response.data;
}
