import { CommonApi } from '@/lib/CommonApi';
import type { PortfolioConfig, PortfolioProject } from '@/types/atelier';

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
): Promise<{ success: boolean; message?: string }> => {
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
export const GetPortfolioAnalyticsApi = async (): Promise<{
  total_visitors: number;
  inquiry_conversion: number;
  top_viewed_projects: Array<{ id: string; title: string; views: number }>;
}> => {
  return CommonApi('GET', '/api/portfolio/analytics/');
};
