import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useGallery } from '../../context/GalleryContext';
import { useToast } from '../../components/ui/Toast';
import { UpgradePlanModal } from '../../components/common/UpgradePlanModal';
import { PersonalInformationSection } from '../../components/settings/PersonalInformationSection';
import { STUDIO_PLANS, renderPlanFeature } from '../../data/plansData';
import {
  User,
  CreditCard,
  Cloud,
  Bell,
  Shield,
  Mail,
  Phone,
  MapPin,
  FileText,
  Bookmark,
  Camera,
  Upload,
  Trash2,
  Info,
  Calendar,
  LayoutGrid,
  Image as ImageIcon,
  Film,
  ChevronRight,
  Crown,
  Check,
  Zap,
  RotateCcw,
  LogOut,
  Sparkles,
  Lock,
  Loader2,
  Sprout,
  Gem,
  Globe,
  Headphones,
  ArrowRight,
  Sliders,
  Briefcase,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { photographer, updateProfile, logout, resetProfile, isLoggingOut } = useAuth();
  const { subscription, availablePlans, upgradeSubscription, resetAllDemoData, galleries } = useGallery();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'drive' | 'notifications' | 'account'>('profile');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Drive settings state
  const [defaultTemplate, setDefaultTemplate] = useState('editorial');
  const [enableWatermark, setEnableWatermark] = useState(photographer.enableWatermark || false);
  const [watermarkText, setWatermarkText] = useState(photographer.watermarkText || '© Ex Studio');

  // Notifications state
  const [notifyVisited, setNotifyVisited] = useState(true);
  const [notifyDownloaded, setNotifyDownloaded] = useState(true);
  const [notifyWeeklyReport, setNotifyWeeklyReport] = useState(true);

  const handleResetDemo = () => {
    if (window.confirm('Reset all demo galleries, media, and profile settings to factory defaults?')) {
      resetAllDemoData();
      resetProfile();
      showToast('Demo Reset', 'Restored original demo photography data.', 'info');
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  };

  return (
    <div className="dashboard-container p-4 sm:p-8 max-w-7xl mx-auto space-y-6 text-neutral-900 dark:text-neutral-100 transition-colors">
      {/* 1. Hero Banner matching exact screenshot */}
      <div className="relative rounded-3xl overflow-hidden border border-neutral-200 dark:border-neutral-800/80 bg-neutral-900 dark:bg-[#0c0d12] p-6 sm:p-8 min-h-[160px] sm:min-h-[175px] flex items-center justify-between shadow-lg">
        {/* Background Image: Sony Alpha Camera Body & Lens on Right */}
        <div className="absolute right-0 top-0 bottom-0 w-full sm:w-2/3 lg:w-1/2 overflow-hidden pointer-events-none select-none">
          <img
            src="/sony_camera_dark.jpg"
            alt="Sony Camera"
            className="w-full h-full object-cover object-right opacity-90 mix-blend-screen"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 via-neutral-900/80 to-transparent dark:from-[#0c0d12] dark:via-[#0c0d12]/80 dark:to-transparent" />
        </div>

        {/* Left Side: Title & Subtitle */}
        <div className="relative z-10 max-w-xl">
          <span className="text-[11px] uppercase tracking-[0.2em] font-mono font-bold text-amber-400 block mb-1.5">
            STUDIO PREFERENCES
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-white tracking-tight font-bold">
            Settings & Plan
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 dark:text-neutral-400 mt-2 leading-relaxed">
            Manage your photographer branding, billing tier, storage limits, and notification preferences.
          </p>
        </div>

        {/* Right Side: Quote before the camera */}
        <div className="hidden md:flex flex-col items-start relative z-10 mr-48 lg:mr-64 shrink-0 text-left">
          <p className="font-serif italic text-neutral-200 dark:text-neutral-300 text-sm sm:text-base leading-snug">
            “Better photos<br />
            Better stories.”
          </p>
          <div className="w-10 h-[1px] bg-neutral-600 dark:bg-neutral-700 mt-2.5" />
        </div>
      </div>

      {/* 2. Navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800/90 w-fit flex-wrap shadow-xs">
        {[
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'billing', label: 'Plan & Billing', icon: CreditCard },
          { id: 'drive', label: 'Drive & Preferences', icon: Cloud },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'account', label: 'Account', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm shadow-amber-500/10'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Main Content Grid for Profile Tab */}
      {activeTab === 'profile' && (
        <PersonalInformationSection
          onManagePlan={() => setActiveTab('billing')}
        />
      )}

      {/* Tab 2: Plan & Billing */}
      {activeTab === 'billing' && (
        <div className="space-y-6 fade-up">
          {/* 1. Currently Active Storage Status Bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#13141b]/95 border border-neutral-200 dark:border-neutral-800/90 flex flex-wrap items-center justify-between gap-4 shadow-sm dark:shadow-inner">
            {/* Active Plan Info */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-neutral-100 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-700/70 flex items-center justify-center text-amber-500 dark:text-amber-400 shrink-0 shadow-sm">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">
                  Currently Active
                </p>
                <p className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white tracking-tight">
                  {subscription?.name?.replace(/\s*\(.*?\)/, '') || 'Master Atelier'} • {subscription?.storageLimitGB || 500} GB Limit
                </p>
              </div>
            </div>

            {/* Storage Meter */}
            <div className="flex flex-col sm:items-center">
              <div className="flex items-center gap-3">
                <div className="w-44 sm:w-60 md:w-72 h-2 rounded-full bg-neutral-200 dark:bg-neutral-800/90 overflow-hidden ring-1 ring-neutral-300 dark:ring-neutral-700/50">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-700 ease-out"
                    style={{
                      width: `${Math.max(
                        1,
                        Math.min(
                          100,
                          Math.round(((subscription?.storageUsedGB || 28.7) / (subscription?.storageLimitGB || 500)) * 100)
                        )
                      )}%`,
                    }}
                  />
                </div>
                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 shrink-0">
                  {Math.max(
                    1,
                    Math.min(
                      100,
                      Math.round(((subscription?.storageUsedGB || 28.7) / (subscription?.storageLimitGB || 500)) * 100)
                    )
                  )}% Used
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono mt-1">
                {subscription?.storageUsedGB || 28.7} GB of {subscription?.storageLimitGB || 500} GB used
              </p>
            </div>

            {/* Upgrade Studio Modal Trigger */}
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700/80 bg-neutral-100 dark:bg-neutral-900/80 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-current text-amber-500" />
              <span>Upgrade Studio Modal</span>
            </button>
          </div>

          {/* 2. Pricing Plan Cards Grid (Exact matching modal cards) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {STUDIO_PLANS.map((plan) => {
              const isCurrent = (subscription?.id || 'plan-standard-1y') === plan.id;
              const Icon = plan.icon;

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 relative ${
                    isCurrent
                      ? 'bg-neutral-50 dark:bg-[#151419] border-2 border-amber-400/90 shadow-xl dark:shadow-2xl shadow-amber-500/10 ring-1 ring-amber-400/30 scale-[1.01]'
                      : 'bg-white dark:bg-[#121319]/90 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50/50 dark:hover:bg-[#151620]'
                  }`}
                >
                  <div>
                    {/* Card Header: Icon & Badge */}
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isCurrent
                            ? 'bg-amber-500/15 border border-amber-500/30 text-amber-500 dark:text-amber-400'
                            : plan.tagType === 'popular'
                            ? 'bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-amber-500 dark:text-amber-400'
                            : 'bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      {isCurrent ? (
                        <span className="px-3 py-1 rounded-full bg-amber-400 text-neutral-950 font-bold text-[10px] uppercase tracking-wider shadow-sm">
                          YOUR PLAN
                        </span>
                      ) : plan.tagType === 'popular' ? (
                        <span className="px-3 py-1 rounded-full bg-amber-400 text-neutral-950 font-bold text-[10px] uppercase tracking-wider shadow-sm">
                          MOST POPULAR
                        </span>
                      ) : plan.tag ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 text-[10px] uppercase font-bold text-neutral-600 dark:text-neutral-400 tracking-wider">
                          {plan.tag}
                        </span>
                      ) : null}
                    </div>

                    {/* Title & Subtitle */}
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white mt-4">{plan.name}</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 min-h-[32px]">
                      {plan.subtitle}
                    </p>

                    {/* Price Block */}
                    <div className="mt-3 pb-4 border-b border-neutral-200 dark:border-neutral-800/80">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {plan.originalPrice && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 dark:bg-rose-500/20 border border-rose-500/30 dark:border-rose-500/40 text-rose-700 dark:text-rose-200 shadow-xs">
                            <span className="text-sm font-serif font-bold line-through decoration-rose-500 dark:decoration-rose-400 decoration-[2.5px]">
                              ₹{plan.originalPrice.toLocaleString('en-IN')}/-
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-300 bg-rose-500/20 px-1.5 py-0.5 rounded">
                              {Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)}% OFF
                            </span>
                          </div>
                        )}
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl sm:text-4xl font-serif font-black text-amber-500 dark:text-amber-400 tracking-tight drop-shadow-[0_2px_8px_rgba(251,191,36,0.25)]">
                            ₹{plan.price.toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">/ Month</span>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-1.5">
                        {plan.billing}
                      </p>
                    </div>

                    {/* Features List with Amber Checkmarks */}
                    <ul className="space-y-3 my-5 text-xs text-neutral-700 dark:text-neutral-300">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <Check className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span className="leading-snug">{renderPlanFeature(feat)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Bottom Action CTA Button */}
                  <button
                    onClick={() => {
                      if (!isCurrent) {
                        upgradeSubscription(plan.id);
                        showToast('Subscription Updated', `Switched to ${plan.name} successfully!`, 'success');
                      }
                    }}
                    disabled={isCurrent}
                    className={`w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isCurrent
                        ? 'bg-amber-400 hover:bg-amber-300 text-neutral-950 shadow-lg shadow-amber-500/20 active:scale-98'
                        : 'bg-neutral-900 dark:bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-white active:scale-98'
                    }`}
                  >
                    {isCurrent ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Current Plan</span>
                      </>
                    ) : (
                      <>
                        <span>{plan.ctaText || `Choose ${plan.name}`}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* 3. Footer Trust Badges */}
          <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800/80 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-900 dark:text-white">Secure & Encrypted</p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Your data is always safe</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-900 dark:text-white">Blazing Fast</p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">NVMe powered storage</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-900 dark:text-white">Access Anywhere</p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Your studio, worldwide</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 shrink-0">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-900 dark:text-white">24/7 Support</p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">We're here for you</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Drive & Preferences */}
      {activeTab === 'drive' && (
        <div className="max-w-2xl space-y-6 fade-up">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800/80 shadow-sm dark:shadow-xl space-y-6">
            <h3 className="text-lg font-serif text-neutral-900 dark:text-white font-bold">Drive & Gallery Defaults</h3>

            {/* Default Client Layout */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
                Default Layout For New Galleries
              </label>
              <select
                value={defaultTemplate}
                onChange={(e) => setDefaultTemplate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white text-xs focus:outline-none focus:border-amber-400"
              >
                <option value="editorial">Editorial (Haute couture & fine-art spacing)</option>
                <option value="masonry">Masonry (Dynamic high-density grid)</option>
                <option value="cinematic">Cinematic (Darkroom with ambient reels)</option>
                <option value="minimal">Minimal (Clean gallery art layout)</option>
              </select>
            </div>

            {/* Studio Watermarking */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white">Watermark Client Previews</p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Apply subtle copyright text over preview images
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={enableWatermark}
                  onChange={(e) => setEnableWatermark(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {enableWatermark && (
                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                  <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    Watermark Text
                  </label>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white text-xs"
                  />
                </div>
              )}
            </div>

            <button
              onClick={() => {
                updateProfile({
                  enableWatermark,
                  watermarkText,
                });
                showToast('Settings Saved', 'Drive and watermark preferences updated.', 'success');
              }}
              className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wider shadow-sm"
            >
              Save Drive Settings
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Notifications */}
      {activeTab === 'notifications' && (
        <div className="max-w-2xl space-y-6 fade-up">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800/80 shadow-sm dark:shadow-xl space-y-6">
            <h3 className="text-lg font-serif text-neutral-900 dark:text-white font-bold">Email & Studio Alerts</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                <div>
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white">Client Gallery First Visit</p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Receive an email notification when your client unlocks their gallery</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyVisited}
                  onChange={(e) => setNotifyVisited(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                <div>
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white">Full Gallery Download Started</p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Alert when a client triggers high-res ZIP package export</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyDownloaded}
                  onChange={(e) => setNotifyDownloaded(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                <div>
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white">Weekly Studio Analytics Digest</p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Summary of total gallery views, favorite selections, and storage</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyWeeklyReport}
                  onChange={(e) => setNotifyWeeklyReport(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={() => showToast('Preferences Saved', 'Notification options updated.', 'success')}
              className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wider shadow-sm"
            >
              Save Notification Preferences
            </button>
          </div>
        </div>
      )}

      {/* Tab 5: Account & Demo Data */}
      {activeTab === 'account' && (
        <div className="max-w-2xl space-y-6 fade-up">
          {/* Reset Demo Data */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800/80 shadow-sm space-y-4">
            <h3 className="text-lg font-serif text-neutral-900 dark:text-white font-bold">Demo Data Management</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              You are running the Ex Studio client demonstration suite. If you have added or deleted galleries and want to restore the pristine initial demo galleries and photos, click below.
            </p>
            <button
              onClick={handleResetDemo}
              className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white text-xs font-bold transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset to Factory Demo Data</span>
            </button>
          </div>

          {/* Sign Out Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-rose-50 dark:bg-red-950/20 border border-rose-200 dark:border-red-900/40 space-y-4">
            <h3 className="text-lg font-serif text-rose-700 dark:text-rose-400 font-bold">Session & Sign Out</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Logged in as <strong className="text-neutral-900 dark:text-white">{photographer.email}</strong>. Logging out returns to the studio sign-in gate.
            </p>
            <button
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isLoggingOut ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              <span>{isLoggingOut ? 'Signing out...' : 'Sign Out of Photographer Session'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Upgrade Plan Modal */}
      <UpgradePlanModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </div>
  );
};
