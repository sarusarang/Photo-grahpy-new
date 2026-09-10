import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useGallery } from '../../context/GalleryContext';
import { useToast } from '../../components/ui/Toast';
import { UpgradePlanModal } from '../../components/common/UpgradePlanModal';
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
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { photographer, updateProfile, logout, resetProfile } = useAuth();
  const { subscription, availablePlans, upgradeSubscription, resetAllDemoData, galleries } = useGallery();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'drive' | 'notifications' | 'account'>('profile');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Profile form state matching screenshot defaults
  const [studioName, setStudioName] = useState(photographer.studioName || 'LUMIÈRE STUDIO & ATELIER');
  const [fullName, setFullName] = useState(photographer.fullName || 'Sarang Varma');
  const [email, setEmail] = useState(photographer.email || 'sarang@lumiere.gallery');
  const [phone, setPhone] = useState(photographer.phone || '+1 (555) 389-4491');
  const [location, setLocation] = useState(photographer.location || 'Milan & San Francisco');
  const [bio, setBio] = useState(
    photographer.bio ||
      'Specializing in fine-art wedding storytelling, editorial haute couture, and architectural documentation. Capturing light and timeless intimacy worldwide.'
  );
  const [avatarUrl, setAvatarUrl] = useState(photographer.avatarUrl || '/sarang_avatar.jpg');

  // Drive settings state
  const [defaultTemplate, setDefaultTemplate] = useState('editorial');
  const [enableWatermark, setEnableWatermark] = useState(photographer.enableWatermark || false);
  const [watermarkText, setWatermarkText] = useState(photographer.watermarkText || '© Ex Studio');

  // Notifications state
  const [notifyVisited, setNotifyVisited] = useState(true);
  const [notifyDownloaded, setNotifyDownloaded] = useState(true);
  const [notifyWeeklyReport, setNotifyWeeklyReport] = useState(true);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      studioName,
      fullName,
      email,
      phone,
      location,
      bio,
      avatarUrl,
      enableWatermark,
      watermarkText,
    });
    showToast('Settings Saved', 'Photographer profile has been updated.', 'success');
  };

  const handleUploadAvatar = () => {
    const newUrl = window.prompt(
      'Enter image URL for Studio Avatar:',
      avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
    );
    if (newUrl && newUrl.trim()) {
      setAvatarUrl(newUrl.trim());
      updateProfile({ avatarUrl: newUrl.trim() });
      showToast('Avatar Updated', 'Studio avatar photo has been updated.', 'success');
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80');
    updateProfile({ avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80' });
    showToast('Avatar Removed', 'Reverted to default studio avatar.', 'info');
  };

  const handleResetDemo = () => {
    if (window.confirm('Reset all demo galleries, media, and profile settings to factory defaults?')) {
      resetAllDemoData();
      resetProfile();
      showToast('Demo Reset', 'Restored original demo photography data.', 'info');
    }
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 text-neutral-900 dark:text-neutral-100 transition-colors">
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start fade-up">
          {/* LEFT COLUMN: Studio Information (8 Cols) */}
          <div className="lg:col-span-8">
            <form
              onSubmit={handleSaveProfile}
              className="rounded-3xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800/90 p-6 sm:p-7 shadow-sm dark:shadow-xl space-y-6"
            >
              {/* Card Header */}
              <div className="flex items-center gap-3.5 pb-1">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400 shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-neutral-900 dark:text-white tracking-tight">
                    Studio Information
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    This information will be used across your galleries and client pages.
                  </p>
                </div>
              </div>

              {/* Row 1: Studio Name & Lead Photographer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    Studio Name
                  </label>
                  <input
                    type="text"
                    value={studioName}
                    onChange={(e) => setStudioName(e.target.value)}
                    placeholder="LUMIÈRE STUDIO & ATELIER"
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white text-xs placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-400 font-medium transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    Lead Photogrpher
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Sarang Varma"
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white text-xs placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-400 font-medium transition-colors"
                  />
                </div>
              </div>

              {/* Row 2: Email Address & Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-400 dark:text-neutral-500 absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="sarang@lumiere.gallery"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white text-xs placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-400 font-medium transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-neutral-400 dark:text-neutral-500 absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 389-4491"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white text-xs placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-400 font-medium transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Studio Location */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Studio Location
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-neutral-400 dark:text-neutral-500 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Milan & San Francisco"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white text-xs placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-400 font-medium transition-colors"
                  />
                </div>
              </div>

              {/* Row 4: Artist Bio / Colophon */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Artist Bio / Colophon
                </label>
                <div className="rounded-xl bg-neutral-50 dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800 p-3 relative focus-within:border-amber-400 transition-colors">
                  <div className="flex items-start gap-2.5">
                    <FileText className="w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0 mt-0.5" />
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      maxLength={500}
                      className="w-full bg-transparent text-neutral-900 dark:text-white text-xs focus:outline-none resize-none leading-relaxed"
                    />
                  </div>
                </div>
                <div className="text-right text-[11px] text-neutral-500 font-mono mt-1">
                  {bio.length}/500
                </div>
              </div>

              {/* Save Changes Button matching bottom-right position */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-amber-500/10 active:scale-[0.98] hover:scale-[1.01]"
                >
                  <Bookmark className="w-4 h-4 stroke-[2.2]" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT COLUMN: 3 Stacked Cards (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Card 1: Studio Avatar */}
            <div className="rounded-3xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800/90 p-5 shadow-sm dark:shadow-xl space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">Studio Avatar</h4>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  This will be used as your logo or profile image.
                </p>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <img
                  src={avatarUrl || '/sarang_avatar.jpg'}
                  alt="Sarang Varma"
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-neutral-300 dark:ring-neutral-700/80 shadow-md shrink-0"
                />
                <div className="flex-1 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleUploadAvatar}
                    className="w-full py-2 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-850 text-neutral-800 dark:text-neutral-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="w-full py-2 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-850 text-neutral-600 dark:text-neutral-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                Recommended: Square image, at least 500x500px
              </p>
            </div>

            {/* Card 2: Quick Info */}
            <div className="rounded-3xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800/90 p-5 shadow-sm dark:shadow-xl space-y-3.5">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">Quick Info</h4>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 text-neutral-500 dark:text-neutral-400">
                    <Calendar className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                    <span>Member Since</span>
                  </div>
                  <span className="text-neutral-900 dark:text-neutral-200 font-medium">Aug 14, 2026</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 text-neutral-500 dark:text-neutral-400">
                    <LayoutGrid className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                    <span>Galleries Created</span>
                  </div>
                  <span className="text-neutral-900 dark:text-neutral-200 font-medium">
                    {galleries.length || 12}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 text-neutral-500 dark:text-neutral-400">
                    <ImageIcon className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                    <span>Total Photos</span>
                  </div>
                  <span className="text-neutral-900 dark:text-neutral-200 font-medium">1,240</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 text-neutral-500 dark:text-neutral-400">
                    <Film className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                    <span>Total Videos</span>
                  </div>
                  <span className="text-neutral-900 dark:text-neutral-200 font-medium">48</span>
                </div>

                <div
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="flex items-center justify-between text-xs cursor-pointer group pt-1"
                >
                  <div className="flex items-center gap-2.5 text-neutral-500 dark:text-neutral-400">
                    <Cloud className="w-4 h-4 text-neutral-400 dark:text-neutral-500 group-hover:text-amber-500 transition-colors" />
                    <span>Storage Used</span>
                  </div>
                  <div className="flex items-center gap-1 text-neutral-900 dark:text-neutral-200 font-medium group-hover:text-amber-500 transition-colors">
                    <span>28.7 GB / 120 GB</span>
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-amber-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: You're on Pro Studio Annual */}
            <div className="rounded-3xl bg-gradient-to-r from-neutral-900 via-[#181510] to-[#261d0b] dark:from-[#12141a] dark:via-[#171510] dark:to-[#241c0e] border border-amber-500/20 p-5 shadow-sm dark:shadow-xl relative overflow-hidden">
              {/* Golden Geometric Mountain Graphic */}
              <div className="absolute right-0 bottom-0 pointer-events-none opacity-50 select-none">
                <svg width="150" height="90" viewBox="0 0 150 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="120,10 150,90 90,90" fill="#eab308" opacity="0.6" />
                  <polygon points="120,10 90,90 70,90" fill="#ca8a04" opacity="0.8" />
                  <polygon points="80,35 110,90 50,90" fill="#facc15" opacity="0.4" />
                  <polygon points="80,35 50,90 35,90" fill="#a16207" opacity="0.7" />
                </svg>
              </div>

              <div className="relative z-10">
                <Crown className="w-4 h-4 text-amber-400 mb-2" />
                <h4 className="text-sm font-semibold text-white">You're on Pro Studio Annual</h4>
                <p className="text-xs text-neutral-400 mt-1 mb-4">
                  Unlock more storage and premium features.
                </p>
                <button
                  type="button"
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-[0.98] hover:scale-[1.02]"
                >
                  <span>Manage Plan</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Plan & Billing */}
      {activeTab === 'billing' && (
        <div className="space-y-6 fade-up">
          {/* Active Plan Overview Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800/80 shadow-sm dark:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-400/30 text-[10px] uppercase font-mono font-bold">
                  Active Paid Plan
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">Billed annually</span>
              </div>
              <h3 className="text-2xl font-serif text-neutral-900 dark:text-white font-bold">{subscription.name}</h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                Expires on <strong className="text-neutral-900 dark:text-white">{subscription.expiryDate}</strong> ({subscription.daysRemaining} days remaining in current cycle)
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsUpgradeModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/10 flex items-center gap-1.5"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Switch / Upgrade Tier</span>
              </button>
            </div>
          </div>

          {/* Storage Allowance Breakdown */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800/80 shadow-sm space-y-4">
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider">
              Cloud Storage Allowance
            </h4>
            <div className="flex justify-between text-xs text-neutral-600 dark:text-neutral-300 font-mono">
              <span>
                Used: <strong className="text-neutral-900 dark:text-white">{subscription.storageUsedGB} GB</strong>
              </span>
              <span>
                Total Limit: <strong className="text-neutral-900 dark:text-white">{subscription.storageLimitGB} GB</strong>
              </span>
            </div>
            <div className="h-3 w-full bg-neutral-100 dark:bg-neutral-950 rounded-full overflow-hidden p-0.5 border border-neutral-200 dark:border-neutral-800">
              <div
                className="h-full bg-amber-400 rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((subscription.storageUsedGB / subscription.storageLimitGB) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Pricing Tiers Table */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 stagger">
            {availablePlans.map((plan) => {
              const isCurrent = subscription.id === plan.id;
              return (
                <div
                  key={plan.id}
                  className={`p-6 rounded-3xl border flex flex-col justify-between transition-all card-lift fade-up ${
                    isCurrent
                      ? 'bg-white dark:bg-[#121319] border-amber-400 shadow-xl ring-1 ring-amber-400'
                      : 'bg-white dark:bg-[#121319] border-neutral-200 dark:border-neutral-800/80 shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold">
                        {plan.tier}
                      </span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-400 text-neutral-950 text-[10px] font-bold">
                          Current
                        </span>
                      )}
                    </div>

                    <h4 className="text-xl font-serif text-neutral-900 dark:text-white font-bold">{plan.name}</h4>
                    <div className="mt-4 mb-6 flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-neutral-900 dark:text-white">${plan.priceMonthly}</span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">/ month</span>
                    </div>

                    <ul className="space-y-3 border-t border-neutral-200 dark:border-neutral-800/80 pt-4 mb-6">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-center gap-2.5 text-xs text-neutral-700 dark:text-neutral-300">
                          <Check className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    disabled={isCurrent}
                    onClick={() => {
                      upgradeSubscription(plan.id);
                      showToast('Tier Changed', `Switched to ${plan.name}.`, 'success');
                    }}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 cursor-default'
                        : 'bg-amber-400 hover:bg-amber-300 text-neutral-950 shadow-md shadow-amber-500/10'
                    }`}
                  >
                    {isCurrent ? 'Current Tier' : `Select ${plan.name}`}
                  </button>
                </div>
              );
            })}
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
              onClick={handleSaveProfile}
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
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Photographer Session</span>
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
