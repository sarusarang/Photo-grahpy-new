import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import {
  getPortfolioConfig,
  savePortfolioConfig,
  normalizePortfolioConfig,
  AVAILABLE_TEMPLATES,
} from '../../services/portfolioService';
import type { PortfolioConfig } from '../../types/portfolio';
import {
  useUpdatePortfolioConfig,
  usePortfolioConfig,
  usePortfolioAnalytics,
  useInquiries,
  useInquiriesAnalytics,
} from '@/hooks/useAtelierQueries';
import { usePlanQuota } from '@/hooks/usePlanQuota';
import { PlanUpgradeModal } from '@/components/billing/PlanUpgradeModal';
import { getPortfolioShareUrl } from '@/utils/domain';
import { getSubdomainPublicUrl } from '@/utils/tenantResolver';
import { PortfolioSubdomainSetting } from '@/components/portfolio/PortfolioSubdomainSetting';
import { PortfolioShareModal } from '../../components/portfolio/PortfolioShareModal';
import { WhatsAppIcon, cleanWhatsAppNumber } from '@/components/portfolio/WhatsAppFloatingButton';
import {
  Globe,
  Copy,
  ExternalLink,
  Eye,
  MessageSquare,
  TrendingUp,
  Smartphone,
  LayoutTemplate,
  Check,
  Edit3,
  Share2,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Users,
  Radio,
  MapPin,
  BarChart3,
  Trophy,
  Lock,
} from 'lucide-react';

export const PortfolioStudioPage: React.FC = () => {
  const navigate = useNavigate();
  const { photographer, user } = useAuth();
  const { showToast } = useToast();

  const portfolioId = user?.username || photographer.id || 'studio';

  // Initialize with personalized starter data if new user
  const [config, setConfig] = useState<PortfolioConfig>(() =>
    normalizePortfolioConfig(getPortfolioConfig(), {
      fullName: photographer.fullName,
      studioName: photographer.studioName,
      email: photographer.email,
      phone: photographer.phone,
      location: photographer.location,
    })
  );

  const { data: serverConfig, isLoading: _isServerLoading, refetch } = usePortfolioConfig();
  const updatePortfolioMutation = useUpdatePortfolioConfig();

  const claimedSubdomain = config.subdomain || (serverConfig as any)?.subdomain;
  const claimedSubdomainStatus = config.subdomainStatus || (serverConfig as any)?.subdomain_status || (serverConfig as any)?.status || null;
  const publicUrl = claimedSubdomain ? getSubdomainPublicUrl(claimedSubdomain) : getPortfolioShareUrl(portfolioId);

  // Live Backend Analytics & Inquiries Queries
  const {
    data: serverAnalytics,
    isLoading: isAnalyticsLoading,
    isError: isAnalyticsError,
    error: _analyticsError,
    refetch: refetchAnalytics,
  } = usePortfolioAnalytics();

  const {
    data: serverInquiries,
    isLoading: _isInquiriesLoading,
    refetch: refetchInquiries,
  } = useInquiries();

  const {
    data: _serverInquiryStats,
  } = useInquiriesAnalytics();

  const planQuota = usePlanQuota();
  const [activeTab, setActiveTab] = useState<'templates' | 'domain' | 'analytics'>('templates');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeLockedFeature, setUpgradeLockedFeature] = useState('Signature Studio Template');
  const [upgradeErrorMessage, setUpgradeErrorMessage] = useState('');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');

  // WhatsApp Direct Inquiries Floating Button State
  const [waEnabled, setWaEnabled] = useState(config.whatsappEnabled !== false);
  const [waNumber, setWaNumber] = useState(config.whatsappNumber || config.contactPhone || '');
  const [waMessage, setWaMessage] = useState(
    config.whatsappPrefillMessage || "Hi, I'm interested in booking a photography session with your studio!"
  );
  const [waLabel, setWaLabel] = useState(config.whatsappButtonLabel || 'Chat on WhatsApp');
  const [isWaSaving, setIsWaSaving] = useState(false);

  useEffect(() => {
    setWaEnabled(config.whatsappEnabled !== false);
    setWaNumber(config.whatsappNumber || config.contactPhone || '');
    setWaMessage(
      config.whatsappPrefillMessage || "Hi, I'm interested in booking a photography session with your studio!"
    );
    setWaLabel(config.whatsappButtonLabel || 'Chat on WhatsApp');
  }, [config.whatsappEnabled, config.whatsappNumber, config.contactPhone, config.whatsappPrefillMessage, config.whatsappButtonLabel]);

  const handleSaveWhatsApp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsWaSaving(true);
    try {
      await handleUpdateConfig({
        whatsappEnabled: waEnabled,
        whatsappNumber: waNumber,
        whatsappPrefillMessage: waMessage,
        whatsappButtonLabel: waLabel,
      });
      showToast('WhatsApp Settings Saved', 'Your portfolio floating WhatsApp button has been updated.', 'success');
    } catch {
      showToast('Saved Locally', 'WhatsApp settings updated in current session.', 'info');
    } finally {
      setIsWaSaving(false);
    }
  };

  // Compute strictly REAL analytics data from backend - zero dummy contents
  const analyticsData = useMemo(() => {
    if (!serverAnalytics) return null;

    // Inquiries from live backend
    const liveInquiriesList = Array.isArray(serverInquiries)
      ? serverInquiries
      : (serverInquiries as any)?.inquiries || [];

    const inquiriesCount = liveInquiriesList.length > 0
      ? liveInquiriesList.length
      : (serverAnalytics.inquiry_conversion ?? 0);

    const bookedLeads = liveInquiriesList.filter(
      (inq: any) => inq.status === 'booked' || inq.status === 'won'
    ).length;
    const rawConversionRate = inquiriesCount > 0
      ? Math.round((bookedLeads / inquiriesCount) * 100)
      : (serverAnalytics as any)?.conversion_rate ?? 0;

    const totalViews = (serverAnalytics as any).total_views ?? serverAnalytics.total_visitors ?? 0;
    const uniqueVisitors = serverAnalytics.total_visitors ?? 0;

    const works = config.featuredWorks || [];
    const rawTopProjects = serverAnalytics.top_viewed_projects || [];
    const topProjectsList = rawTopProjects.map((p: any) => {
      const matched = works.find(
        (cp) => cp.id === p.id || cp.title.toLowerCase() === p.title.toLowerCase()
      );
      return {
        id: p.id,
        title: p.title,
        category: p.category || matched?.category || 'Showcase Project',
        views: p.views || 0,
        coverUrl: matched?.coverUrl || '',
        inquiriesGenerated: p.inquiries_generated ?? 0,
      };
    });

    const viewsByDevice = (serverAnalytics as any).views_by_device || {
      mobile: 0,
      desktop: 0,
      tablet: 0,
    };

    const chartPoints: number[] = (serverAnalytics as any).chart_points || [];
    const chartLabels: string[] = (serverAnalytics as any).chart_labels || [];
    const recentVisitors: any[] = (serverAnalytics as any).recent_visitors || [];

    return {
      totalViews,
      uniqueVisitors,
      inquiriesCount,
      conversionRate: rawConversionRate,
      avgDuration: (serverAnalytics as any).avg_engagement_duration || '—',
      viewsByDevice,
      topProjects: topProjectsList,
      chartLabels,
      chartPoints,
      recentVisitors,
      recentInquiries: liveInquiriesList.slice(0, 5),
    };
  }, [serverAnalytics, serverInquiries, config.featuredWorks]);

  const handleRefreshAll = async () => {
    try {
      await Promise.all([refetchAnalytics(), refetchInquiries(), refetch()]);
      showToast('Analytics Refreshed', 'Live statistics synced with server.', 'success');
    } catch {
      showToast('Sync Updated', 'Latest metrics re-evaluated.', 'info');
    }
  };

  // Sync with live server portfolio configuration
  useEffect(() => {
    if (serverConfig && typeof serverConfig === 'object') {
      setConfig(
        normalizePortfolioConfig(serverConfig, {
          fullName: photographer.fullName,
          studioName: photographer.studioName,
          email: photographer.email,
          phone: photographer.phone,
          location: photographer.location,
        })
      );
    }
  }, [serverConfig, photographer.fullName, photographer.studioName, photographer.email, photographer.phone, photographer.location]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      showToast('Portfolio URL Copied', 'Public link copied to your clipboard.', 'success');
    } catch {
      showToast('Failed to copy', 'Please copy manually from the input.', 'error');
    }
  };

  const handleSwitchTemplate = async (templateId: string) => {
    if (!planQuota.isPortfolioTemplateAllowed(templateId)) {
      const tplName = AVAILABLE_TEMPLATES.find((t) => t.id === templateId)?.name || templateId;
      showToast(
        'Template Locked',
        `${tplName} requires Studio Premium Elite. Upgrade your subscription to unlock all signature templates.`,
        'error'
      );
      setUpgradeLockedFeature(`${tplName} Template`);
      setUpgradeErrorMessage(`The "${tplName}" layout is exclusive to Studio Premium Elite members. Upgrade now to unlock all 4 signature templates, unlimited showcase works, and full inquiry tracking.`);
      setIsUpgradeModalOpen(true);
      return;
    }

    const updated = savePortfolioConfig({ templateId });
    setConfig(updated);
    try {
      await updatePortfolioMutation.mutateAsync({ templateId } as any);
      showToast('Template Updated', `Switched to ${AVAILABLE_TEMPLATES.find((t) => t.id === templateId)?.name || templateId}.`, 'success');
    } catch {
      // Saved locally
      showToast('Template Updated', 'Template switched and saved.', 'success');
    }
  };

  const handleUpdateConfig = async (updates: Partial<PortfolioConfig>) => {
    const next = savePortfolioConfig(updates);
    setConfig(next);
    try {
      await updatePortfolioMutation.mutateAsync(updates as any);
    } catch {
      // Offline fallback
    }
  };

  const openLiveEditor = () => {
    navigate(`/portfolio/${portfolioId}?edit=true`);
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 space-y-6 transition-colors">
      {/* ─── 1. HERO COMMAND BAR ─── */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-neutral-900 via-[#13151f] to-[#0c0d12] border border-neutral-800/90 text-white shadow-2xl overflow-hidden">
        {/* Ambient lighting glows */}
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 font-mono text-[10px] uppercase tracking-wider font-semibold">
                <Globe className="w-3 h-3" />
                Live Portfolio
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-300 font-mono text-[10px] uppercase tracking-wider">
                <LayoutTemplate className="w-3 h-3 text-amber-400" />
                {AVAILABLE_TEMPLATES.find((t) => t.id === config.templateId)?.name || 'Custom'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {config.studioName}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-xl line-clamp-1">
              {config.tagline}
            </p>

            {/* Public URL Input Bar */}
            <div className="flex items-center gap-2 pt-2 max-w-lg">
              <div className="flex-1 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-neutral-300">
                <Globe className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span className="truncate">{publicUrl}</span>
              </div>
              <button
                onClick={handleCopyLink}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-200 hover:text-white transition-colors cursor-pointer"
                title="Copy link"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-200 hover:text-white transition-colors cursor-pointer"
                title="Open in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Share Portfolio Modal Trigger */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-white/10 transition-all cursor-pointer shadow-md"
            >
              <Share2 className="w-4 h-4 text-amber-400" />
              <span>Share Portfolio</span>
            </button>

            {/* Primary Open Live Editor Button */}
            <button
              onClick={openLiveEditor}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 text-neutral-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-2xl transition-all cursor-pointer ring-4 ring-amber-400/20"
            >
              <Edit3 className="w-4 h-4 stroke-[2.5]" />
              <span>Open & Edit on Template</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. TAB NAVIGATION ─── */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-0">
        <div className="flex items-center gap-2">
          {[
            { id: 'templates', label: 'Signature Templates', icon: LayoutTemplate },
            { id: 'domain', label: 'Personal Subdomain', icon: Globe },
            { id: 'analytics', label: 'Visitor Analytics', icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer -mb-px ${
                  isActive
                    ? 'border-amber-400 text-amber-600 dark:text-amber-400 font-bold'
                    : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => refetch()}
          className="mb-px p-2 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Sync with backend"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ─── TAB 1: TEMPLATE ARCHITECTURE ─── */}
      {activeTab === 'templates' && (
        <div className="space-y-6 max-w-5xl mx-auto py-2">
          <div className="text-center space-y-1">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold">
              Signature Aesthetics
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
              Select Your Signature Layout
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto">
              Switch between our two distinct luxury layouts. All content seamlessly carries over.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {AVAILABLE_TEMPLATES.map((tpl) => {
              const isSelected = config.templateId === tpl.id;
              const isDarkTpl = tpl.id === 'darkroom-atelier';
              const isAllowed = planQuota.isPortfolioTemplateAllowed(tpl.id);
              return (
                <div
                  key={tpl.id}
                  onClick={() => handleSwitchTemplate(tpl.id)}
                  className={`group rounded-3xl overflow-hidden bg-white dark:bg-[#13141b] border-2 transition-all cursor-pointer shadow-md flex flex-col ${
                    isSelected
                      ? 'border-amber-400 ring-4 ring-amber-400/20 shadow-2xl -translate-y-1'
                      : !isAllowed
                      ? 'border-neutral-200 dark:border-neutral-800 opacity-80 hover:opacity-100 hover:border-amber-400/40'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-xl'
                  }`}
                >
                  <div className="relative aspect-video overflow-hidden bg-neutral-950">
                    <img
                      src={tpl.previewThumb}
                      alt={tpl.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    
                    {!isAllowed ? (
                      <span className="absolute top-4 left-4 px-3 py-1 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider bg-neutral-900/90 text-amber-300 border border-amber-400/30 flex items-center gap-1.5 shadow-md">
                        <Lock className="w-3 h-3 text-amber-400" />
                        <span>Elite Plan Only</span>
                      </span>
                    ) : (
                      <span
                        className={`absolute top-4 left-4 px-3 py-1 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider ${
                          isDarkTpl
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                            : 'bg-white/90 text-neutral-900'
                        }`}
                      >
                        {tpl.styleBadge}
                      </span>
                    )}

                    {isSelected && (
                      <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-amber-400 text-neutral-950 font-black text-xs flex items-center gap-1.5 shadow-lg">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        Active
                      </div>
                    )}

                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h3 className="text-xl font-bold">{tpl.name}</h3>
                      <p className="text-xs text-neutral-300 line-clamp-1">{tpl.subtitle}</p>
                    </div>
                  </div>

                  <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {tpl.description}
                    </p>

                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-1.5">
                        {tpl.highlights.map((h) => (
                          <span
                            key={h}
                            className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[10px] font-mono text-neutral-600 dark:text-neutral-300"
                          >
                            ✓ {h}
                          </span>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSwitchTemplate(tpl.id);
                        }}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          !isAllowed
                            ? 'bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/30'
                            : isSelected
                            ? 'bg-amber-400 text-neutral-950 shadow-md'
                            : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200'
                        }`}
                      >
                        {!isAllowed ? (
                          <>
                            <Lock className="w-3.5 h-3.5 text-amber-400" />
                            <span>Upgrade to Unlock</span>
                          </>
                        ) : isSelected ? (
                          'Currently Selected'
                        ) : (
                          'Use This Template'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ─── WHATSAPP FLOATING DIRECT INQUIRIES SETTINGS CARD ─── */}
          <div className="mt-10 rounded-3xl bg-white dark:bg-[#13141b] border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30 shadow-sm">
                  <WhatsAppIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
                      Floating WhatsApp Action Button
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-mono uppercase font-bold tracking-wider">
                      1-Tap Connect
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Displays an interactive floating WhatsApp icon at the bottom of all portfolio templates for instant client booking.
                  </p>
                </div>
              </div>

              {/* Status Toggle Switch */}
              <div className="flex items-center gap-3 self-start sm:self-center">
                <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                  {waEnabled ? 'Enabled' : 'Disabled'}
                </span>
                <button
                  type="button"
                  onClick={() => setWaEnabled(!waEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    waEnabled ? 'bg-[#25D366]' : 'bg-neutral-300 dark:bg-neutral-700'
                  }`}
                  title="Toggle WhatsApp floating button on portfolio"
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      waEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveWhatsApp} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                    <span>WhatsApp Number (with Country Code) *</span>
                    <span className="text-[10px] text-amber-500 font-sans">e.g. +91 / +1</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={waNumber}
                      onChange={(e) => setWaNumber(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 text-sm focus:outline-none focus:border-[#25D366] transition-colors font-mono"
                    />
                    <Smartphone className="w-4 h-4 text-neutral-400 absolute right-3.5 top-3.5 pointer-events-none" />
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Include your international dial code so clients worldwide can start a direct chat.
                  </p>
                </div>

                {/* Button Label */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-neutral-700 dark:text-neutral-300 block">
                    Floating Button Label / Tooltip
                  </label>
                  <input
                    type="text"
                    value={waLabel}
                    onChange={(e) => setWaLabel(e.target.value)}
                    placeholder="Chat on WhatsApp"
                    className="w-full px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 text-sm focus:outline-none focus:border-[#25D366] transition-colors"
                  />
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Text displayed on the floating pill across your portfolio.
                  </p>
                </div>
              </div>

              {/* Pre-filled Message */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-neutral-700 dark:text-neutral-300 block">
                  Default Pre-filled Client Greeting Message
                </label>
                <textarea
                  rows={2}
                  value={waMessage}
                  onChange={(e) => setWaMessage(e.target.value)}
                  placeholder="Hi, I'm interested in booking a photography session with your studio!"
                  className="w-full px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 text-xs sm:text-sm focus:outline-none focus:border-[#25D366] transition-colors resize-none"
                />
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Pre-populated message when the client taps the button to reach you.
                </p>
              </div>

              {/* Live Preview & Direct Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800/80">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider">Preview:</span>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366] text-white text-xs font-bold shadow-md">
                    <WhatsAppIcon className="w-4 h-4 shrink-0" />
                    <span>{waLabel || 'Chat on WhatsApp'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {cleanWhatsAppNumber(waNumber) && (
                    <a
                      href={`https://wa.me/${cleanWhatsAppNumber(waNumber)}?text=${encodeURIComponent(waMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Test WhatsApp Link in new tab"
                    >
                      <span>Test Chat Link</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <button
                    type="submit"
                    disabled={isWaSaving}
                    className="px-6 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-95 disabled:opacity-60 text-white text-xs font-bold transition-all shadow-md shadow-[#25D366]/20 cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>{isWaSaving ? 'Saving...' : 'Save WhatsApp Settings'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── TAB 2: PERSONAL SUBDOMAIN & WEB ADDRESS ─── */}
      {activeTab === 'domain' && (
        <div className="space-y-6 max-w-4xl mx-auto py-3">
          <div className="text-center space-y-1 mb-6">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold">
              PORTFOLIO ADDRESS &amp; BRANDING
            </span>
            <h2 className="text-2xl font-black text-neutral-900 dark:text-white">
              Personal Portfolio Subdomain
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto">
              Claim and publish your personal photographer web address for signature client showcases and proofing.
            </p>
          </div>

          <div className="flex justify-center">
            <PortfolioSubdomainSetting
              currentSubdomain={claimedSubdomain}
              currentStatus={claimedSubdomainStatus as any}
              studioName={config.studioName}
              onSubdomainUpdated={(newSubdomain, fullUrl) => {
                const updated = savePortfolioConfig({ subdomain: newSubdomain, subdomainStatus: 'active' });
                setConfig(updated);
                showToast('Subdomain Active', `Your portfolio is now live via Wildcard DNS at ${fullUrl}`, 'success');
                refetch();
              }}
            />
          </div>

          {/* Subdomain Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="p-4 rounded-2xl bg-white/[0.02] dark:bg-white/[0.03] border border-neutral-200 dark:border-neutral-800 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-500 text-xs font-bold uppercase tracking-wider">
                <Globe className="w-4 h-4" />
                <span>Custom Identity</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Direct branding without long generic URLs. Share <span className="text-amber-300 font-mono">yourname.exshare.ai</span> directly on social media and client contracts.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] dark:bg-white/[0.03] border border-neutral-200 dark:border-neutral-800 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Instant SSL Security</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Every portfolio subdomain includes automatic wildcard HTTPS encryption with zero setup or certificate renewal required.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] dark:bg-white/[0.03] border border-neutral-200 dark:border-neutral-800 space-y-1.5">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Radio className="w-4 h-4" />
                <span>Live Client Sync</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                All showcase works, about narratives, template themes, and client inquiries update instantly across your custom domain.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: VISITOR ANALYTICS & STUDIO INTELLIGENCE ─── */}
      {activeTab === 'analytics' && (
        <div className="space-y-8 max-w-6xl mx-auto py-2">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-[#111219] border border-white/10 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-wide">
                  Visitor Analytics & Insights
                </h2>
                <p className="text-xs text-neutral-400">
                  Track portfolio views, engagement, and client inquiries
                </p>
              </div>
            </div>

            {/* Time Filter & Refresh CTA */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-black/40 rounded-2xl p-1 border border-white/10">
                {(['7d', '30d', 'all'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      timeRange === r
                        ? 'bg-amber-400 text-neutral-950 shadow-md shadow-amber-500/20'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : 'All Time'}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleRefreshAll}
                className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-all cursor-pointer"
                title="Refresh Live Metrics"
              >
                <RefreshCw className={`w-4 h-4 ${isAnalyticsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* ─── CASE 1: LOADING SKELETON ─── */}
          {isAnalyticsLoading && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-36 rounded-3xl bg-white/[0.03] border border-white/10 animate-pulse p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="w-24 h-3 rounded bg-white/10" />
                      <div className="w-10 h-10 rounded-2xl bg-white/10" />
                    </div>
                    <div className="w-32 h-8 rounded bg-white/10" />
                  </div>
                ))}
              </div>
              <div className="h-64 rounded-3xl bg-white/[0.03] border border-white/10 animate-pulse" />
            </div>
          )}

          {/* ─── CASE 2: NORMAL USER FALLBACK (NO DATA OR NETWORK ERROR) ─── */}
          {!isAnalyticsLoading && (isAnalyticsError || !analyticsData) && (
            <div className="space-y-6">
              <div className="relative p-8 sm:p-12 rounded-3xl bg-[#111219] border border-white/10 shadow-2xl text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-400/5">
                  <BarChart3 className="w-7 h-7" />
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {isAnalyticsError ? 'Unable to Load Analytics' : 'No Visitor Activity Recorded Yet'}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                    {isAnalyticsError
                      ? 'We could not retrieve your latest portfolio metrics at this time. Please check your internet connection or try refreshing.'
                      : 'Visitor statistics, page views, and inquiry conversions will appear here automatically once visitors browse your public portfolio.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleRefreshAll}
                    className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-400/10"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh Analytics</span>
                  </button>
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer border border-white/10"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Public Portfolio</span>
                  </a>
                </div>
              </div>

              {/* Show real inquiries if available from /api/inquiries/ */}
              {Array.isArray(serverInquiries) && serverInquiries.length > 0 && (
                <div className="rounded-3xl p-6 bg-[#111219] border border-white/10 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                        Real Inquiries from Server ({serverInquiries.length})
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      Connected to /api/inquiries/
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {serverInquiries.map((inq: any, i: number) => (
                      <div
                        key={inq.id || i}
                        className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <p className="font-bold text-white truncate">{inq.client_name || inq.name || 'Client Lead'}</p>
                          <p className="text-[11px] text-neutral-400 truncate">
                            {inq.event_type || inq.service || 'Inquiry'} • {inq.event_date || 'Date TBD'}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {inq.status || 'New'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── CASE 3: SUCCESS WITH 100% REAL LIVE BACKEND DATA ─── */}
          {!isAnalyticsLoading && !isAnalyticsError && analyticsData && (
            <div className="space-y-8">
              {/* 4 HERO KPI METRIC CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* 1. Total Impressions & Views */}
                <div className="group relative p-6 rounded-3xl bg-gradient-to-br from-[#121624] via-[#10121a] to-[#0c0d12] border border-sky-500/20 hover:border-sky-500/40 transition-all duration-300 shadow-xl overflow-hidden">
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-sky-400">
                        Total Impressions
                      </span>
                      <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shadow-lg shadow-sky-500/10">
                        <Eye className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
                        {analyticsData.totalViews.toLocaleString()}
                      </p>
                      <p className="text-[11px] text-neutral-400 pt-1">Live recorded views</p>
                    </div>
                  </div>
                </div>

                {/* 2. Unique Studio Visitors */}
                <div className="group relative p-6 rounded-3xl bg-gradient-to-br from-[#161224] via-[#11101a] to-[#0c0d12] border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 shadow-xl overflow-hidden">
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-purple-400">
                        Unique Visitors
                      </span>
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shadow-lg shadow-purple-500/10">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
                        {analyticsData.uniqueVisitors.toLocaleString()}
                      </p>
                      <p className="text-[11px] text-neutral-400 pt-1">Distinct client sessions</p>
                    </div>
                  </div>
                </div>

                {/* 3. Inquiries & Conversion Rate */}
                <div className="group relative p-6 rounded-3xl bg-gradient-to-br from-[#101e18] via-[#0f1513] to-[#0c0d12] border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 shadow-xl overflow-hidden">
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-emerald-400">
                        Inquiries & Leads
                      </span>
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-3xl sm:text-4xl font-black font-mono text-emerald-300 tracking-tight">
                        {analyticsData.inquiriesCount} Leads
                      </p>
                      <p className="text-[11px] text-neutral-400 pt-1">
                        {analyticsData.conversionRate}% Booked / Won
                      </p>
                    </div>
                  </div>
                </div>

                {/* 4. Mobile vs Desktop Traffic */}
                <div className="group relative p-6 rounded-3xl bg-gradient-to-br from-[#1e1910] via-[#15130f] to-[#0c0d12] border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300 shadow-xl overflow-hidden">
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-amber-400">
                        Device Traffic
                      </span>
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
                        <Smartphone className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-3xl sm:text-4xl font-black font-mono text-amber-300 tracking-tight">
                        {analyticsData.viewsByDevice.mobile}% Mobile
                      </p>
                      <p className="text-[11px] text-neutral-400 pt-1">
                        {analyticsData.viewsByDevice.desktop}% Desktop • {analyticsData.viewsByDevice.tablet}% Tablet
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* TRAFFIC VELOCITY GRAPH */}
              {analyticsData.chartPoints.length > 0 ? (
                <div className="rounded-3xl p-6 sm:p-8 bg-[#111219] border border-white/10 shadow-2xl space-y-6">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-amber-400" />
                    <h3 className="text-base font-bold text-white tracking-wide">
                      Live Traffic Activity Curve
                    </h3>
                  </div>

                  <div className="relative pt-4 pb-2">
                    <div className="h-56 w-full flex items-end">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 700 200" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="liveTrafficGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path
                          d={`M 0 200 ${analyticsData.chartPoints
                            .map((val, idx) => {
                              const x = (idx / Math.max(1, analyticsData.chartPoints.length - 1)) * 700;
                              const maxVal = Math.max(...analyticsData.chartPoints, 1) * 1.15;
                              const y = 190 - (val / maxVal) * 160;
                              return `L ${x} ${y}`;
                            })
                            .join(' ')} L 700 200 Z`}
                          fill="url(#liveTrafficGradient)"
                        />
                        <path
                          d={`${analyticsData.chartPoints
                            .map((val, idx) => {
                              const x = (idx / Math.max(1, analyticsData.chartPoints.length - 1)) * 700;
                              const maxVal = Math.max(...analyticsData.chartPoints, 1) * 1.15;
                              const y = 190 - (val / maxVal) * 160;
                              return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                            })
                            .join(' ')}`}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>

                    <div className="flex justify-between items-center pt-3 text-xs font-mono text-neutral-400 border-t border-white/5">
                      {analyticsData.chartLabels.map((lbl, i) => (
                        <span key={i}>{lbl}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl p-8 bg-[#111219] border border-white/10 text-center space-y-2">
                  <p className="text-sm font-bold text-white">No Traffic Data for This Timeframe Yet</p>
                  <p className="text-xs text-neutral-400">
                    Visitor curves will render automatically as clients view your portfolio.
                  </p>
                </div>
              )}

              {/* TOP PERFORMING WORKS */}
              <div className="rounded-3xl p-6 sm:p-8 bg-[#111219] border border-white/10 shadow-2xl space-y-6">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <h3 className="text-base font-bold text-white tracking-wide">
                    Live Top Visited Projects
                  </h3>
                </div>

                {analyticsData.topProjects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analyticsData.topProjects.map((p, idx) => (
                      <div
                        key={p.id || idx}
                        className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-4"
                      >
                        <span className="font-mono font-black text-amber-400 text-sm">#{idx + 1}</span>
                        {p.coverUrl && (
                          <img
                            src={p.coverUrl}
                            alt={p.title}
                            className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">{p.title}</p>
                          <p className="text-[11px] font-mono text-amber-400">{p.views} views</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-center space-y-2">
                    <p className="text-xs text-neutral-400">
                      No project page visits recorded yet from client traffic.
                    </p>
                  </div>
                )}
              </div>

              {/* RECENT VISITOR SESSIONS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-3xl p-6 bg-[#111219] border border-white/10 shadow-2xl space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                      Recent Visitor Sessions
                    </h3>
                  </div>

                  {analyticsData.recentVisitors.length > 0 ? (
                    <div className="space-y-2">
                      {analyticsData.recentVisitors.map((v: any, i: number) => (
                        <div
                          key={v.id || i}
                          className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
                        >
                          <span className="font-bold text-white">{v.city || 'Global'}, {v.country || 'Visitor'}</span>
                          <span className="font-mono text-neutral-400">{v.device || 'Mobile'}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-center">
                      <p className="text-xs text-neutral-400">No recent visitor sessions logged yet.</p>
                    </div>
                  )}
                </div>

                {/* RECENT INQUIRIES */}
                <div className="rounded-3xl p-6 bg-[#111219] border border-white/10 shadow-2xl space-y-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                      Recent Inquiries
                    </h3>
                  </div>

                  {analyticsData.recentInquiries.length > 0 ? (
                    <div className="space-y-2">
                      {analyticsData.recentInquiries.map((inq: any, i: number) => (
                        <div
                          key={inq.id || i}
                          className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
                        >
                          <div>
                            <p className="font-bold text-white">{inq.client_name || inq.name || 'Client'}</p>
                            <p className="text-[11px] text-neutral-400">{inq.event_type || 'Inquiry'}</p>
                          </div>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase font-mono bg-emerald-500/20 text-emerald-300">
                            {inq.status || 'New'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-center">
                      <p className="text-xs text-neutral-400">No client inquiries received yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── SHARE PORTFOLIO MODAL ─── */}
      <PortfolioShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        config={config}
        publicUrl={publicUrl}
      />

      {/* ─── PLAN UPGRADE MODAL ─── */}
      <PlanUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        errorCode="TEMPLATE_LOCKED_PLAN_REQUIRED"
        lockedFeature={upgradeLockedFeature}
        errorMessage={upgradeErrorMessage}
      />
    </div>
  );
};
