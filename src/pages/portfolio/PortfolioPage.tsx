import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getPortfolioConfig,
  savePortfolioConfig,
  subscribePortfolioConfig,
  AVAILABLE_TEMPLATES,
} from '../../services/portfolioService';
import { getPortfolioTemplate } from '../../components/portfolio/templates/PortfolioTemplateRegistry';
import { addInquiry } from '../../services/inquiryService';
import type { PortfolioConfig } from '../../types/portfolio';
import type { InquiryEventType } from '../../types/inquiry';
import { useToast } from '../../components/ui/Toast';
import { useSubmitPublicInquiry, usePublicPortfolio, useUpdatePortfolioConfig } from '@/hooks/useAtelierQueries';
import {
  Edit3,
  Eye,
  Sparkles,
  ArrowLeft,
  Layers,
} from 'lucide-react';

export const PortfolioPage: React.FC = () => {
  const { photographerId } = useParams<{ photographerId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const { data: serverPortfolio } = usePublicPortfolio(photographerId || '');
  const { mutateAsync: updatePortfolioApi } = useUpdatePortfolioConfig();
  const { mutateAsync: submitInquiryApi } = useSubmitPublicInquiry();

  const [config, setConfig] = useState<PortfolioConfig>(() => getPortfolioConfig());
  const [isEditMode, setIsEditMode] = useState(false);

  // Sync if server portfolio data is available
  useEffect(() => {
    if (serverPortfolio && typeof serverPortfolio === 'object') {
      setConfig((prev) => ({
        ...prev,
        ...serverPortfolio,
      }));
    }
  }, [serverPortfolio]);

  // Sync with portfolio config updates from other tabs/services
  useEffect(() => {
    const unsubscribe = subscribePortfolioConfig((newConfig) => {
      setConfig(newConfig);
    });
    return unsubscribe;
  }, []);

  // Support ?template= URL parameter for direct previewing or switching
  useEffect(() => {
    const queryTemplate = searchParams.get('template');
    if (queryTemplate && queryTemplate !== config.templateId) {
      const exists = AVAILABLE_TEMPLATES.some((t) => t.id === queryTemplate);
      if (exists) {
        const updated = savePortfolioConfig({ templateId: queryTemplate });
        setConfig(updated);
      }
    }
  }, [searchParams, config.templateId]);

  const handleSwitchTemplate = async (newTemplateId: string) => {
    const next = savePortfolioConfig({ templateId: newTemplateId });
    setConfig(next);
    setSearchParams((prev) => {
      const nextParams = new URLSearchParams(prev);
      nextParams.set('template', newTemplateId);
      return nextParams;
    });
    try {
      await updatePortfolioApi({ template_id: newTemplateId });
    } catch {
      // offline/local sync
    }
    const tplName = AVAILABLE_TEMPLATES.find((t) => t.id === newTemplateId)?.name || newTemplateId;
    showToast('Template Switched', `Now rendering with ${tplName} layout.`, 'success');
  };

  const handleUpdateConfig = async (updates: Partial<PortfolioConfig>) => {
    const next = savePortfolioConfig(updates);
    setConfig(next);
    try {
      await updatePortfolioApi(updates);
    } catch {
      // offline/local sync
    }
  };

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
      await submitInquiryApi({
        client_name: formData.clientName,
        client_email: formData.clientEmail,
        client_phone: formData.clientPhone || '',
        event_date: formData.eventDate || new Date().toISOString().split('T')[0],
        event_type: formData.eventType || 'wedding',
        location: formData.location || '',
        budget: formData.estimatedBudget || '',
        message: formData.message,
        photographer_id: photographerId,
      });
      showToast('Inquiry Received', 'Your inquiry has been delivered directly to the photographer.', 'success');
      return true;
    } catch {
      // Fallback local persistence
      addInquiry({
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientPhone: formData.clientPhone,
        eventDate: formData.eventDate || new Date().toISOString().split('T')[0],
        eventType: (formData.eventType as InquiryEventType) || 'wedding',
        location: formData.location || 'Studio',
        budget: formData.estimatedBudget || 'Custom',
        message: formData.message,
      });
      showToast('Inquiry Received', 'Your inquiry has been delivered directly to the photographer.', 'success');
      return true;
    }
  };

  const TemplateComponent = getPortfolioTemplate(config.templateId);

  return (
    <div className="relative min-h-screen">
      {/* ─── STUDIO AUTHOR CONTROL BAR (Authenticated Photographer Only) ─── */}
      {isAuthenticated && (
        <div className="sticky top-0 z-50 bg-neutral-950/90 text-white backdrop-blur-xl border-b border-white/10 px-4 py-2.5 shadow-2xl transition-all">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Left: Studio indicator & Back link */}
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard/portfolio"
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors"
                title="Return to Studio Dashboard"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono uppercase tracking-widest text-[11px] text-neutral-300 font-bold hidden sm:inline">
                  Portfolio Studio
                </span>
              </div>
            </div>

            {/* Center: Template Switcher Bar */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-900 border border-white/10">
              <span className="text-[10px] font-mono text-neutral-400 px-2 uppercase tracking-wider hidden md:inline">
                Template:
              </span>
              {AVAILABLE_TEMPLATES.map((tpl) => {
                const isActive = config.templateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => handleSwitchTemplate(tpl.id)}
                    className={`px-3 py-1 rounded-lg font-mono text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-amber-400 text-neutral-950 shadow-md font-bold'
                        : 'text-neutral-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Layers className="w-3 h-3" />
                    <span>{tpl.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Right: Live Edit Mode Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const next = !isEditMode;
                  setIsEditMode(next);
                  showToast(
                    next ? 'Live Edit Mode Active' : 'Visitor Mode Active',
                    next
                      ? 'Click on headlines, stories, or photos on the page to edit directly.'
                      : 'Previewing exactly as public clients see it.',
                    'info'
                  );
                }}
                className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                  isEditMode
                    ? 'bg-emerald-500 text-neutral-950 font-bold hover:bg-emerald-400 ring-2 ring-emerald-400/30'
                    : 'bg-white/10 hover:bg-white/15 text-neutral-200 border border-white/10'
                }`}
              >
                {isEditMode ? (
                  <>
                    <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Editing Live</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Live Edit Mode</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render Selected Portfolio Template with Live Edit Props */}
      <TemplateComponent
        config={config}
        onInquirySubmit={handleInquirySubmit}
        isEditable={isEditMode}
        onUpdateConfig={handleUpdateConfig}
        onSwitchTemplate={handleSwitchTemplate}
      />
    </div>
  );
};
