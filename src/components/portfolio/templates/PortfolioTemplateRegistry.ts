import React from 'react';
import type { PortfolioConfig } from '../../../types/portfolio';
import { EditorialVogueTemplate } from './EditorialVogueTemplate';
import { DarkroomAtelierTemplate } from './DarkroomAtelierTemplate';

export interface PortfolioTemplateProps {
  config: PortfolioConfig;
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
  'darkroom-atelier': DarkroomAtelierTemplate,
};

export function getPortfolioTemplate(templateId: string): PortfolioTemplateComponent {
  return TEMPLATE_COMPONENTS[templateId] || EditorialVogueTemplate;
}
