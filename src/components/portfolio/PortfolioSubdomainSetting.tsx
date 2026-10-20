/**
 * EX SHARE Atelier — Photographer Portfolio Subdomains Setting
 * Re-exports PortfolioSubdomainForm, PortfolioSubdomainSettings, and SubdomainSettingsCard for unified access.
 */
export { PortfolioSubdomainForm } from './PortfolioSubdomainForm';
export {
  PortfolioSubdomainSettings,
  PortfolioSubdomainSettings as PortfolioSubdomainSetting,
} from './PortfolioSubdomainSettings';
export { SubdomainSettingsCard } from '../SubdomainSettingsCard';
export type { SubdomainStatus, SubdomainAvailability } from '../../types/portfolio';
