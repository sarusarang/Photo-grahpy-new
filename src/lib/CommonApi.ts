import { axiosInstance } from '@/lib/axiosInstance';
import type { AxiosRequestConfig, Method } from 'axios';

export const CommonApi = async <T = any>(
  method: Method | 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  const upperMethod = method.toUpperCase() as Method;

  const headers = {
    ...(config?.headers || {}),
  };

  // If sending FormData, do not set manual multipart/form-data header without boundary;
  // letting Axios / browser set Content-Type ensures proper boundary generation.
  if (isFormData && headers['Content-Type'] && typeof headers['Content-Type'] === 'string' && headers['Content-Type'].toLowerCase().startsWith('multipart/form-data')) {
    delete headers['Content-Type'];
  }

  const response = await axiosInstance({
    method: upperMethod,
    url,
    data: upperMethod !== 'GET' ? data : undefined,
    params: upperMethod === 'GET' ? (data || config?.params) : config?.params,
    ...config,
    headers,
  });

  return response.data as T;
};

export default CommonApi;
