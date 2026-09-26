import React from 'react';
import {
  UpgradePlanModal,
  type UpgradePlanModalProps,
} from '@/components/common/UpgradePlanModal';

export interface PlanUpgradeModalProps extends UpgradePlanModalProps {}

/**
 * Unified Studio Plan Upgrade Modal
 * Forwards directly to the comprehensive UpgradePlanModal, ensuring all sections
 * of the application (Create Gallery, Drive, Events, Portfolio, Inquiries) display
 * the exact same rich, live plan pricing, feature breakdown, storage meters, and quota alerts.
 */
export const PlanUpgradeModal: React.FC<PlanUpgradeModalProps> = (props) => {
  return <UpgradePlanModal {...props} />;
};

export default PlanUpgradeModal;
