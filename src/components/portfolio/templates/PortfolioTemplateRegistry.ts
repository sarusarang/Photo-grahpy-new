import React from 'react';
import type { PortfolioConfig } from '../../../types/portfolio';
import { EditorialVogueTemplate } from './EditorialVogueTemplate';
import { DarkroomAtelierTemplate } from './DarkroomAtelierTemplate';

export interface PortfolioTemplateProps {
  config: PortfolioConfig;
  photographerSlug?: string;
  onInquirySubmit?: (inquiry: {
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
    eventDate?: string;
    eventType: string;
    location?: string;
    estimatedBudget?: string;
    message: string;
  }) => Promise<boolean>;
  isPreview?: boolean;
  isEditable?: boolean;
  onUpdateConfig?: (updates: Partial<PortfolioConfig>) => void;
  onSwitchTemplate?: (templateId: string) => void;
}

export type PortfolioTemplateComponent = React.FC<PortfolioTemplateProps>;

const TEMPLATE_COMPONENTS: Record<string, PortfolioTemplateComponent> = {
  'editorial-vogue': EditorialVogueTemplate,
  'editorial': EditorialVogueTemplate,
  'editorial-white': EditorialVogueTemplate,
  'darkroom-atelier': DarkroomAtelierTemplate,
  'masonry': DarkroomAtelierTemplate,
  'cinematic': DarkroomAtelierTemplate,
  'minimal': EditorialVogueTemplate,
};

export function getPortfolioTemplate(templateId?: string): PortfolioTemplateComponent {
  if (!templateId) return EditorialVogueTemplate;
  const key = templateId.toLowerCase().trim();
  return TEMPLATE_COMPONENTS[key] || EditorialVogueTemplate;
}
