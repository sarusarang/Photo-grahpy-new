import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPortfolioConfig, subscribePortfolioConfig } from '../../services/portfolioService';
import { getPortfolioTemplate } from '../../components/portfolio/templates/PortfolioTemplateRegistry';
import { addInquiry } from '../../services/inquiryService';
import type { PortfolioConfig } from '../../types/portfolio';
import type { InquiryEventType } from '../../types/inquiry';
import { useToast } from '../../components/ui/Toast';
import { Sliders, ArrowLeft } from 'lucide-react';

export const PortfolioPage: React.FC = () => {
  const { photographerId } = useParams<{ photographerId: string }>();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [config, setConfig] = useState<PortfolioConfig>(() => getPortfolioConfig());

  useEffect(() => {
    const unsubscribe = subscribePortfolioConfig((newConfig) => {
      setConfig(newConfig);
    });
    return unsubscribe;
  }, []);

  const handleInquirySubmit = async (formData: {
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
    eventDate?: string;
    eventType: string;
    location?: string;
    estimatedBudget?: string;
    message: string;
  }) => {
    try {
      addInquiry({
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientPhone: formData.clientPhone,
        eventDate: formData.eventDate || '2026-11-24',
        eventType: (formData.eventType as InquiryEventType) || 'wedding',
        location: formData.location || 'Taj Lake Palace, Udaipur',
        budget: formData.estimatedBudget || '₹4,50,000 - ₹6,00,000',
        message: formData.message,
      });
      showToast('Inquiry Received', 'Your inquiry has been delivered directly to the photographer.', 'success');
      return true;
    } catch {
      showToast('Error', 'Failed to dispatch inquiry. Please try again.', 'error');
      return false;
    }
  };

  const TemplateComponent = getPortfolioTemplate(config.templateId);

  return (
    <div className="relative min-h-screen">
      {/* Floating Studio Edit Button for Authenticated Photographer */}
      {isAuthenticated && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in zoom-in-95 duration-200">
          <Link
            to="/dashboard/portfolio"
            className="px-4 py-2.5 rounded-full bg-neutral-900/95 dark:bg-amber-400 text-white dark:text-neutral-950 text-xs font-mono font-bold shadow-2xl border border-white/20 dark:border-neutral-900 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all backdrop-blur-md"
            title="Return to Studio Customizer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Customize Studio</span>
          </Link>
        </div>
      )}

      {/* Render Selected Portfolio Template */}
      <TemplateComponent config={config} onInquirySubmit={handleInquirySubmit} />
    </div>
  );
};
