import axios from 'axios';
import { getTenantSubdomain } from '../utils/tenant';
import { handleAxiosThrottleError } from '../utils/throttleHandler';

const rawBase = (import.meta.env.VITE_API_BASE_URL || 'https://server.exshare.ai').trim();
// Ensure base URL points to the API root correctly
const BACKEND_URL = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

// 1. Authenticated Studio Client
export const authApi = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 45000,
});

authApi.interceptors.request.use((config) => {
  // Normalize path if needed
  if (config.url && !config.url.startsWith('/api') && !config.url.startsWith('http')) {
    config.url = `/api/${config.url.replace(/^\//, '')}`;
  }

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('access_token') || localStorage.getItem('token')
      : null;

  if (token) {
    config.headers.Authorization =
      token.startsWith('Bearer ') || token.startsWith('Token ')
        ? token
        : `Bearer ${token}`;
  }
  return config;
});

// 2. Anonymous Public Portfolio Client
export const publicTenantApi = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 45000,
});

publicTenantApi.interceptors.request.use((config) => {
  if (config.url && !config.url.startsWith('/api') && !config.url.startsWith('http')) {
    config.url = `/api/${config.url.replace(/^\//, '')}`;
  }

  const tenant = getTenantSubdomain();
  if (tenant) {
    config.headers['X-Tenant-Subdomain'] = tenant;
  }
  if (typeof window !== 'undefined' && window.location?.host) {
    config.headers['X-Forwarded-Host'] = window.location.host;
  }
  return config;
});

// Response interceptors to capture 429 throttling errors
authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    handleAxiosThrottleError(error);
    return Promise.reject(error);
  }
);

publicTenantApi.interceptors.response.use(
  (response) => response,
  (error) => {
    handleAxiosThrottleError(error);
    return Promise.reject(error);
  }
);
