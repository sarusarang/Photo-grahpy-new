import axios from 'axios';
import type { AxiosError, AxiosResponse } from 'axios';
import { handleAxiosThrottleError } from '@/utils/throttleHandler';

const rawBaseURL = (import.meta.env.VITE_API_BASE_URL || 'https://server.exshare.ai').trim();
const normalizedBaseURL = rawBaseURL.endsWith('/') ? rawBaseURL.slice(0, -1) : rawBaseURL;

/**
 * Global API Client configured with automatic 429 Rate Limit Handling,
 * JWT cookie support, and path normalization.
 */
export const apiClient = axios.create({
  baseURL: normalizedBaseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 45000,
});

apiClient.interceptors.request.use((config) => {
  if (config.url && !config.url.startsWith('/api') && !config.url.startsWith('http')) {
    config.url = `/api/${config.url.replace(/^\//, '')}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<{ detail?: string; message?: string }>) => {
    handleAxiosThrottleError(error);
    return Promise.reject(error);
  }
);

export default apiClient;
