import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import {
  getPortfolioConfig,
  savePortfolioConfig,
  resetPortfolioConfig,
  getPortfolioAnalytics,
  AVAILABLE_TEMPLATES,
} from '../../services/portfolioService';
import type { PortfolioConfig, PortfolioProject } from '../../types/portfolio';
import { PortfolioDevicePreview } from '../../components/portfolio/preview/PortfolioDevicePreview';
import { GalleryPickerModal } from '../../components/portfolio/GalleryPickerModal';
import { ImageUploadButton } from '../../components/portfolio/ImageUploadButton';
import { PortfolioWorkCard } from '../../components/portfolio/PortfolioWorkCard';
import {
  Globe,
  Copy,
  ExternalLink,
  Eye,
  MessageSquare,
  TrendingUp,
  Smartphone,
  Sparkles,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Sliders,
  LayoutTemplate,
  Monitor,
  Image as ImageIcon,
  User,
  Phone,
  Mail,
  MapPin,
  Check,
  Images,
} from 'lucide-react';

/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Shared sub-components Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

const SectionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  badge?: string;
  children: React.ReactNode;
}> = ({ icon, title, badge, children }) => (
  <div className="rounded-2xl bg-white dark:bg-[#13141b]/95 border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
    <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-amber-400/10 flex items-center justify-center text-amber-500">
          {icon}
        </div>
        <span className="font-semibold text-sm text-neutral-900 dark:text-white">{title}</span>
      </div>
      {badge && (
        <span className="text-[10px] font-mono text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-lg">
          {badge}
        </span>
      )}
    </div>
    <div className="p-5 space-y-4">{children}</div>
  </div>
);

const Field: React.FC<{
  label: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        {label}
      </label>
      {hint && <span className="text-[10px] text-neutral-400 font-mono">{hint}</span>}
    </div>
    {children}
  </div>
);

const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-amber-400 transition-colors';

/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Main page Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

export const PortfolioStudioPage: React.FC = () => {
  const { photographer, user } = useAuth();
  const { showToast } = useToast();

  const portfolioId = user?.username || photographer.id || 'studio';
  const publicUrl = `${window.location.origin}/portfolio/${portfolioId}`;

  const [config, setConfig] = useState<PortfolioConfig>(() => getPortfolioConfig());
  const [activeTab, setActiveTab] = useState<'editor' | 'templates' | 'preview'>('editor');
  const [isSaving, setIsSaving] = useState(false);
  const [isGalleryPickerOpen, setIsGalleryPickerOpen] = useState(false);

  const analytics = useMemo(() => getPortfolioAnalytics(), []);

  useEffect(() => {
    if (photographer.fullName && config.artistName === 'Sarang Varma') {
      setConfig((prev) => ({
        ...prev,
        artistName: photographer.fullName || prev.artistName,
        studioName: photographer.studioName || `${photographer.fullName} Studio`,
      }));
    }
  }, [photographer]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      showToast('Portfolio URL Copied', 'Link copied to your clipboard.', 'success');
    } catch {
      showToast('Failed to copy', 'Please copy manually from the input.', 'error');
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    savePortfolioConfig(config);
    setTimeout(() => {
      setIsSaving(false);
      showToast('Portfolio Published', 'Your updates are now live on your public link.', 'success');
    }, 400);
  };

  const handleReset = () => {
    if (window.confirm('Reset all portfolio customizations to studio defaults?')) {
      const def = resetPortfolioConfig();
      setConfig(def);
      showToast('Reset to Defaults', 'Portfolio configuration has been restored.', 'info');
    }
  };

  const handleAddProjectFromGallery = (project: PortfolioProject) => {
    setConfig((prev) => ({
      ...prev,
      featuredWorks: [project, ...prev.featuredWorks],
    }));
    showToast('Project Added', `"${project.title}" added to your portfolio.`, 'success');
  };

  const handleDeleteProject = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      featuredWorks: prev.featuredWorks.filter((p) => p.id !== id),
    }));
  };

  const handleUpdateProject = (id: string, updates: Partial<PortfolioProject>) => {
    setConfig((prev) => ({
      ...prev,
      featuredWorks: prev.featuredWorks.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 space-y-6 transition-colors">

      {/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ 1. HERO COMMAND BAR Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <div className="relative rounded-2xl p-5 sm:p-7 bg-gradient-to-br from-neutral-900 via-[#12141d] to-[#0c0d12] border border-neutral-800/90 text-white shadow-xl overflow-hidden">
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-12 w-56 h-56 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 font-mono text-[10px] uppercase tracking-wider font-semibold">
                <Globe className="w-3 h-3 text-amber-400" />
                Portfolio Studio
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif tracking-tight text-white font-bold">
              Portfolio Customizer & Templates
            </h1>
            <p className="text-xs text-neutral-400 max-w-lg leading-relaxed hidden sm:block">
              Set up your public profile, curate your works, switch templates, and preview on any device.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-amber-400" />
              Copy Link
            </button>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              View Live
            </a>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-70 text-neutral-950 text-xs font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 stroke-[2.5]" />
              {isSaving ? 'Saving...' : 'Save & Publish'}
            </button>
          </div>
        </div>
      </div>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ 2. ANALYTICS KPI STRIP Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Profile Views',
            value: analytics.totalViews.toLocaleString(),
            sub: `${analytics.uniqueVisitors.toLocaleString()} unique visitors`,
            icon: <Eye className="w-4 h-4" />,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
          },
          {
            label: 'Direct Leads',
            value: String(analytics.inquiryConversions),
            sub: 'Awaiting response',
            icon: <MessageSquare className="w-4 h-4" />,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
          },
          {
            label: 'Conversion Rate',
            value: `${analytics.conversionRate}%`,
            sub: 'Booking intent',
            icon: <TrendingUp className="w-4 h-4" />,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
          },
          {
            label: 'Device Traffic',
            value: `${analytics.viewsByDevice.mobile}% Mobile`,
            sub: `${analytics.viewsByDevice.desktop}% Desktop`,
            icon: <Smartphone className="w-4 h-4" />,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-2xl bg-white dark:bg-[#13141b]/95 border border-neutral-200 dark:border-neutral-800 shadow-xs hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                {stat.label}
              </span>
              <div className={`w-8 h-8 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                {stat.icon}
              </div>
            </div>
            <p className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${stat.color}`}>{stat.value}</p>
            <p className="text-[11px] text-neutral-500 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ 3. TAB NAV Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-0">
        <div className="flex items-center gap-1">
          {[
            { id: 'editor', label: 'Studio Setup', icon: Sliders },
            { id: 'templates', label: 'Templates', icon: LayoutTemplate },
            { id: 'preview', label: 'Preview', icon: Monitor },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer -mb-px ${
                  isActive
                    ? 'border-amber-400 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={handleReset}
          className="mb-px p-2 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Reset to defaults"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ 4. STUDIO SETUP EDITOR Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      {activeTab === 'editor' && (
        <div className="space-y-5">
          {/* 2-col grid for top sections */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">

            {/* LEFT — Studio Identity & Banner */}
            <SectionCard icon={<User className="w-4 h-4" />} title="Studio Identity" badge="Header · Hero">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Studio Name">
                  <input
                    type="text"
                    value={config.studioName}
                    onChange={(e) => setConfig({ ...config, studioName: e.target.value })}
                    className={inputCls}
                    placeholder="Your Studio Name"
                  />
                </Field>
                <Field label="Photographer Name">
                  <input
                    type="text"
                    value={config.artistName}
                    onChange={(e) => setConfig({ ...config, artistName: e.target.value })}
                    className={inputCls}
                    placeholder="Full Name"
                  />
                </Field>
              </div>

              <Field label="Tagline Headline">
                <input
                  type="text"
                  value={config.tagline}
                  onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. Visual Poetry · High-Fashion Weddings"
                />
              </Field>

              <Field label="Location & Availability">
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                  <input
                    type="text"
                    value={config.location}
                    onChange={(e) => setConfig({ ...config, location: e.target.value })}
                    className={`${inputCls} pl-9`}
                    placeholder="Mumbai & Worldwide"
                  />
                </div>
              </Field>

              <ImageUploadButton
                label="Cover Banner Image"
                aspectHint="16:9 · Full-width hero"
                value={config.bannerUrl}
                onChange={(url) => setConfig({ ...config, bannerUrl: url })}
              />
            </SectionCard>

            {/* RIGHT — Artistic Philosophy */}
            <SectionCard icon={<Sparkles className="w-4 h-4" />} title="Artistic Philosophy & Story" badge="About section">
              <Field label="Philosophy Quote">
                <textarea
                  rows={2}
                  value={config.philosophyQuote}
                  onChange={(e) => setConfig({ ...config, philosophyQuote: e.target.value })}
                  className={`${inputCls} resize-none`}
                  placeholder={`"Photography is..."`}
                />
              </Field>

              <Field label="Biography / Studio Overview">
                <textarea
                  rows={3}
                  value={config.bio}
                  onChange={(e) => setConfig({ ...config, bio: e.target.value })}
                  className={`${inputCls} resize-none`}
                  placeholder="Tell your story..."
                />
              </Field>

              <ImageUploadButton
                label="Photographer Portrait"
                aspectHint="Square · Profile photo"
                value={config.avatarUrl}
                onChange={(url) => setConfig({ ...config, avatarUrl: url })}
              />
            </SectionCard>
          </div>

          {/* FULL WIDTH — Contact & Pricing (Full Fitted) */}
          <SectionCard icon={<Phone className="w-4 h-4" />} title="Contact & Pricing" badge="Client inquiries & rates">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="Email Address">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                  <input
                    type="email"
                    value={config.contactEmail}
                    onChange={(e) => setConfig({ ...config, contactEmail: e.target.value })}
                    className={`${inputCls} pl-9`}
                    placeholder="hello@studio.com"
                  />
                </div>
              </Field>

              <Field label="Phone / WhatsApp">
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                  <input
                    type="tel"
                    value={config.contactPhone}
                    onChange={(e) => setConfig({ ...config, contactPhone: e.target.value })}
                    className={`${inputCls} pl-9`}
                    placeholder="+91 98201 XXXXX"
                  />
                </div>
              </Field>

              <Field label="Instagram Handle">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-neutral-400">@</span>
                  <input
                    type="text"
                    value={config.instagramHandle}
                    onChange={(e) => setConfig({ ...config, instagramHandle: e.target.value })}
                    className={`${inputCls} pl-8`}
                    placeholder="studio_handle"
                  />
                </div>
              </Field>

              <Field label="Website Link">
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                  <input
                    type="url"
                    value={config.websiteUrl}
                    onChange={(e) => setConfig({ ...config, websiteUrl: e.target.value })}
                    className={`${inputCls} pl-9`}
                    placeholder="https://studio.com"
                  />
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <Field label="Starting Investment">
                <input
                  type="text"
                  value={config.pricingStartingAt}
                  onChange={(e) => setConfig({ ...config, pricingStartingAt: e.target.value })}
                  className={inputCls}
                  placeholder="₹4,50,000 / Day"
                />
              </Field>

              <div className="flex flex-col justify-end">
                <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 cursor-pointer hover:border-amber-400 transition-colors h-[42px]">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">Commissions Open</p>
                    <p className="text-[10px] text-neutral-500">Show "accepting bookings" badge on portfolio</p>
                  </div>
                  <div className="relative shrink-0">
                    <input
                      type="checkbox"
                      checked={config.isBookingOpen}
                      onChange={(e) => setConfig({ ...config, isBookingOpen: e.target.checked })}
                      className="sr-only"
                    />
                    <div className={`w-10 h-6 rounded-full transition-colors ${config.isBookingOpen ? 'bg-amber-400' : 'bg-neutral-300 dark:bg-neutral-700'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-all ${config.isBookingOpen ? 'left-5' : 'left-1'}`} />
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </SectionCard>

          {/* FULL WIDTH — Portfolio Works */}
          <SectionCard
            icon={<Images className="w-4 h-4" />}
            title={`Portfolio Works (${config.featuredWorks.length})`}
            badge="Featured projects"
          >
            <div className="flex items-center justify-between -mt-1 mb-1">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Select galleries from your Drive to showcase in your portfolio.
              </p>
              <button
                type="button"
                onClick={() => setIsGalleryPickerOpen(true)}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                Add from Gallery
              </button>
            </div>

            {config.featuredWorks.length === 0 ? (
              <div className="text-center py-10 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-800">
                <ImageIcon className="w-8 h-8 mx-auto mb-2 text-neutral-300 dark:text-neutral-700" />
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">No works added yet</p>
                <p className="text-xs text-neutral-400 mt-0.5">Click "Add from Gallery" to feature your work</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 max-h-[720px] overflow-y-auto pr-1 custom-scrollbar">
                {config.featuredWorks.map((proj, idx) => (
                  <PortfolioWorkCard
                    key={proj.id}
                    project={proj}
                    index={idx}
                    onUpdate={handleUpdateProject}
                    onDelete={handleDeleteProject}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          {/* Save CTA */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#13141b]/95 border border-neutral-200 dark:border-neutral-800">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Changes are saved locally until you publish.
            </p>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-70 text-neutral-950 text-sm font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              {isSaving ? 'Publishing...' : 'Save & Publish'}
            </button>
          </div>
        </div>
      )}


      {/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ TAB 2: TEMPLATE GALLERY Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      {activeTab === 'templates' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="text-center space-y-1">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold">
              Multi-Template Architecture
            </span>
            <h2 className="text-2xl font-serif font-bold text-neutral-900 dark:text-white">
              Select Your Signature Layout
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Each template is crafted with distinct typography, animations, and narrative structure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {AVAILABLE_TEMPLATES.map((tpl) => {
              const isSelected = config.templateId === tpl.id;
              return (
                <div
                  key={tpl.id}
                  onClick={() => {
                    setConfig({ ...config, templateId: tpl.id });
                    showToast(`Switched to ${tpl.name}`, 'Click Save & Publish to apply.', 'info');
                  }}
                  className={`group rounded-2xl overflow-hidden bg-white dark:bg-[#13141b] border-2 transition-all cursor-pointer shadow-sm flex flex-col ${
                    isSelected
                      ? 'border-amber-400 ring-4 ring-amber-400/15 shadow-xl -translate-y-0.5'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-md'
                  }`}
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={tpl.previewThumb}
                      alt={tpl.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-amber-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                      {tpl.styleBadge}
                    </span>
                    {isSelected && (
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                        Active
                      </div>
                    )}
                  </div>

                  <div className="p-5 space-y-3 flex-1">
                    <h3 className="text-lg font-serif font-bold text-neutral-900 dark:text-white">{tpl.name}</h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">{tpl.description}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {tpl.highlights.map((h) => (
                        <span
                          key={h}
                          className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800/80 text-[10px] font-mono text-neutral-600 dark:text-neutral-300"
                        >
                          Ã¢Å“â€œ {h}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="px-5 pb-5">
                    <div
                      className={`w-full py-2 rounded-xl font-bold text-xs text-center uppercase tracking-wider transition-all ${
                        isSelected
                          ? 'bg-amber-400 text-neutral-950'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700'
                      }`}
                    >
                      {isSelected ? 'Currently Active' : 'Use This Template'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ TAB 3: DEVICE SIMULATOR Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      {activeTab === 'preview' && (
        <div className="h-[calc(100vh-220px)] min-h-[560px]">
          <PortfolioDevicePreview config={config} portfolioId={portfolioId} />
        </div>
      )}

      {/* Gallery Picker Modal */}
      <GalleryPickerModal
        isOpen={isGalleryPickerOpen}
        onClose={() => setIsGalleryPickerOpen(false)}
        onSelect={handleAddProjectFromGallery}
        existingProjectGallerySlugs={config.featuredWorks
          .filter((p) => p.gallerySlug)
          .map((p) => p.gallerySlug!)}
      />
    </div>
  );
};
