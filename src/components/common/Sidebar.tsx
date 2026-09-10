import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useGallery } from '../../context/GalleryContext';
import {
  FolderKanban,
  GraduationCap,
  Settings as SettingsIcon,
  LayoutGrid,
  Cloud,
  Zap,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  onOpenUpgradeModal?: () => void;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenUpgradeModal, onCloseMobile }) => {
  const { logout } = useAuth();
  const { galleries, subscription } = useGallery();
  const navigate = useNavigate();
  const location = useLocation();

  const percentageUsed = Math.min(
    100,
    Math.round((subscription.storageUsedGB / subscription.storageLimitGB) * 100)
  );

  const navItems = [
    {
      to: '/dashboard/drive',
      label: 'Drive',
      icon: FolderKanban,
      badge: (galleries.length || 5).toString(),
    },
    {
      to: '/dashboard/tutorials',
      label: 'Tutorial',
      icon: GraduationCap,
    },
    {
      to: '/dashboard/settings',
      label: 'Settings',
      icon: SettingsIcon,
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-white dark:bg-[#0c0d12] text-neutral-800 dark:text-neutral-200 border-r border-neutral-200 dark:border-neutral-800/80 flex flex-col h-full shrink-0 select-none transition-colors">
      {/* Navigation Section */}
      <nav className="p-3 space-y-1 stagger">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          // Exact active detection: only the first one (Dashboard) or Drive when on drive, but Settings when on settings
          const isActive =
            location.pathname === item.to &&
            (item.label === 'Dashboard'
              ? false
              : item.label === 'Drive'
              ? location.pathname === '/dashboard/drive' || location.pathname === '/dashboard'
              : true);

          return (
            <Link
              key={`${item.to}-${idx}`}
              to={item.to}
              onClick={onCloseMobile}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all fade-up ${
                isActive
                  ? 'bg-amber-500/10 dark:bg-amber-500/10 border border-amber-400/60 text-amber-600 dark:text-amber-400 font-semibold shadow-xs'
                  : 'text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900/50 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                />
                <span className="text-sm">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                    isActive
                      ? 'bg-amber-200 dark:bg-neutral-800 text-amber-900 dark:text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* CLIENT TEMPLATES Section */}
      <div className="px-3 pt-3 pb-2">
        <div className="px-3 pb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Client Templates
          </span>
          <LayoutGrid className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
        </div>

        <div className="space-y-1">
          <Link
            to={`/gallery/${galleries[0]?.slug || 'sarang-wedding-editorial'}?previewTemplate=editorial`}
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900/60 transition-colors group"
          >
            <div className="flex items-center gap-2.5 font-medium">
              <LayoutGrid className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
              <span>1. Editorial</span>
            </div>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono font-normal">
              Vogue spread
            </span>
          </Link>

          <Link
            to={`/gallery/${galleries[0]?.slug || 'sarang-wedding-editorial'}?previewTemplate=masonry`}
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900/60 transition-colors group"
          >
            <div className="flex items-center gap-2.5 font-medium">
              <LayoutGrid className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
              <span>2. Masonry</span>
            </div>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono font-normal">
              Dynamic grid
            </span>
          </Link>

          <Link
            to={`/gallery/${galleries[0]?.slug || 'sarang-wedding-editorial'}?previewTemplate=cinematic`}
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900/60 transition-colors group"
          >
            <div className="flex items-center gap-2.5 font-medium">
              <LayoutGrid className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
              <span>3. Cinematic</span>
            </div>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono font-normal">
              Darkroom
            </span>
          </Link>

          <Link
            to={`/gallery/${galleries[0]?.slug || 'sarang-wedding-editorial'}?previewTemplate=minimal`}
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900/60 transition-colors group"
          >
            <div className="flex items-center gap-2.5 font-medium">
              <LayoutGrid className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
              <span>4. Minimal</span>
            </div>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono font-normal">
              Clean art
            </span>
          </Link>
        </div>
      </div>

      {/* Spacer to push storage card & sign out to bottom */}
      <div className="flex-1" />

      {/* Storage & Plan Card Widget */}
      <div className="p-3">
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#111319] border border-neutral-200/90 dark:border-neutral-800/90 shadow-sm space-y-3 transition-colors">
          {/* Cloud Storage Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 dark:text-white">
              <Cloud className="w-4 h-4 text-amber-500" />
              <span>
                <strong>28.7 GB</strong> of {subscription.storageLimitGB} GB
              </span>
            </div>
          </div>

          {/* Progress Bar with Percentage */}
          <div className="flex items-center gap-2.5">
            <div className="flex-1 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full progress-animate"
                style={{ width: `${percentageUsed}%` }}
              />
            </div>
            <span className="text-[11px] font-mono font-bold text-neutral-700 dark:text-neutral-400">
              {percentageUsed}%
            </span>
          </div>

          {/* Upgrade Plan Button */}
          <button
            onClick={onOpenUpgradeModal}
            className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/10 active:scale-[0.98]"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Upgrade Plan</span>
          </button>

          {/* Billing Cycle Details */}
          <div className="text-[11px] pt-1 space-y-0.5">
            <p className="font-semibold text-neutral-600 dark:text-neutral-400">Billing Cycle</p>
            <p className="text-amber-600 dark:text-amber-400 font-bold">
              {subscription.daysRemaining} days remaining
            </p>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">
              Expires {subscription.expiryDate}
            </p>
          </div>
        </div>
      </div>

      {/* Sign Out Button */}
      <div className="px-3 pb-3 pt-1 border-t border-neutral-200 dark:border-neutral-800/80">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-neutral-900/50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
