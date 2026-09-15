import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useGallery } from '../../context/GalleryContext';
import {
  FolderKanban,
  GraduationCap,
  Settings as SettingsIcon,
  LayoutGrid,
  Cloud,
  Zap,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenUpgradeModal?: () => void;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
  onOpenUpgradeModal,
  onCloseMobile,
}) => {
  const { galleries, subscription } = useGallery();
  const navigate = useNavigate();
  const location = useLocation();

  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('photo_saas_sidebar_collapsed');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => {
        const next = !prev;
        localStorage.setItem('photo_saas_sidebar_collapsed', JSON.stringify(next));
        return next;
      });
    }
  };

  // Keyboard shortcut: Ctrl+B or Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCollapse]);

  // In mobile drawer, always stay fully expanded
  const effectiveCollapsed = onCloseMobile ? false : isCollapsed;

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

  const clientTemplates = [
    { id: 'editorial', name: '1. Editorial', sub: 'Vogue spread' },
    { id: 'masonry', name: '2. Masonry', sub: 'Dynamic grid' },
    { id: 'cinematic', name: '3. Cinematic', sub: 'Darkroom' },
    { id: 'minimal', name: '4. Minimal', sub: 'Clean art' },
  ];

  return (
    <aside
      className={`bg-white dark:bg-[#0c0d12] text-neutral-800 dark:text-neutral-200 border-r border-neutral-200 dark:border-neutral-800/80 flex flex-col h-full shrink-0 select-none transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] relative overflow-x-hidden ${
        effectiveCollapsed ? 'w-[78px]' : 'w-64'
      }`}
    >
      {/* Top Header & Collapse Toggle (Desktop only) */}
      {!onCloseMobile && (
        <div
          className={`flex items-center px-3.5 py-3 border-b border-neutral-200/60 dark:border-neutral-800/60 transition-all duration-300 ${
            effectiveCollapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          {!effectiveCollapsed && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-mono transition-opacity duration-200">
              Workspace
            </span>
          )}
          <button
            onClick={toggleCollapse}
            title={effectiveCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
            className={`rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-all cursor-pointer flex items-center justify-center ${
              effectiveCollapsed ? 'w-11 h-11' : 'p-1.5'
            }`}
          >
            {effectiveCollapsed ? (
              <PanelLeftOpen className="w-5 h-5 text-neutral-400 hover:text-amber-500 transition-colors" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-neutral-500 dark:text-neutral-400 hover:text-amber-500 transition-colors" />
            )}
          </button>
        </div>
      )}

      {/* Navigation Section */}
      <nav className={`p-3 space-y-1.5 stagger ${effectiveCollapsed ? 'px-2.5' : 'px-3'}`}>
        {navItems.map((item, idx) => {
          const Icon = item.icon;
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
              className={`group relative flex items-center rounded-2xl text-xs transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
                effectiveCollapsed
                  ? 'justify-center w-12 h-12 mx-auto hover:scale-105 active:scale-95'
                  : 'justify-between px-3.5 py-2.5'
              } ${
                isActive
                  ? 'bg-amber-500/10 dark:bg-amber-500/10 border border-amber-400/60 text-amber-600 dark:text-amber-400 font-semibold shadow-xs'
                  : 'text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900/50 font-medium'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`shrink-0 transition-all duration-200 ${
                    effectiveCollapsed
                      ? 'w-[22px] h-[22px]'
                      : 'w-4 h-4'
                  } ${
                    isActive
                      ? 'text-amber-600 dark:text-amber-400 stroke-[2.2]'
                      : 'text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white stroke-[1.9]'
                  }`}
                />
                {!effectiveCollapsed && <span className="text-sm truncate">{item.label}</span>}
              </div>

              {!effectiveCollapsed && item.badge && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                    isActive
                      ? 'bg-amber-200 dark:bg-neutral-800 text-amber-900 dark:text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {/* Notification badge dot when collapsed */}
              {effectiveCollapsed && item.badge && (
                <span
                  className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white dark:ring-[#0c0d12]"
                  title={`${item.badge} items`}
                />
              )}

              {/* Floating Tooltip when collapsed */}
              {effectiveCollapsed && (
                <div className="hidden group-hover:flex absolute left-full ml-3 px-3 py-1.5 bg-neutral-900 text-white text-xs font-semibold rounded-xl shadow-2xl border border-neutral-800 whitespace-nowrap z-50 pointer-events-none items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-amber-400 text-neutral-950">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* CLIENT TEMPLATES Section */}
      {!effectiveCollapsed ? (
        <div className="px-3 pt-3 pb-2 transition-opacity duration-200">
          <div className="px-3 pb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Client Templates
            </span>
            <LayoutGrid className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
          </div>

          <div className="space-y-1">
            {clientTemplates.map((tpl) => (
              <Link
                key={tpl.id}
                to={`/gallery/${galleries[0]?.slug || 'sarang-wedding-editorial'}?previewTemplate=${tpl.id}`}
                target="_blank"
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900/60 transition-colors group"
              >
                <div className="flex items-center gap-2.5 font-medium">
                  <LayoutGrid className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
                  <span>{tpl.name}</span>
                </div>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono font-normal">
                  {tpl.sub}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-2.5 py-2 flex flex-col items-center">
          <div className="group relative w-12 h-12 flex items-center justify-center rounded-2xl text-neutral-500 dark:text-neutral-400 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-neutral-900/70 hover:scale-105 active:scale-95 transition-all cursor-pointer">
            <LayoutGrid className="w-[22px] h-[22px] shrink-0 stroke-[1.9]" />
            <div className="hidden group-hover:flex flex-col absolute left-full ml-3 p-2.5 bg-neutral-900 text-white text-xs rounded-2xl shadow-2xl border border-neutral-800 whitespace-nowrap z-50 gap-1.5 min-w-[170px] animate-in fade-in zoom-in-95 duration-150">
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 font-mono px-2 py-0.5">
                Client Templates
              </span>
              {clientTemplates.map((tpl) => (
                <Link
                  key={tpl.id}
                  to={`/gallery/${galleries[0]?.slug || 'sarang-wedding-editorial'}?previewTemplate=${tpl.id}`}
                  target="_blank"
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  <span>{tpl.name}</span>
                  <span className="text-[10px] text-neutral-400 font-mono ml-3">{tpl.sub}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Spacer to push storage card to bottom */}
      <div className="flex-1" />

      {/* Storage & Plan Widget */}
      <div className={effectiveCollapsed ? 'p-2.5' : 'p-3'}>
        {!effectiveCollapsed ? (
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#111319] border border-neutral-200/90 dark:border-neutral-800/90 shadow-sm space-y-3 transition-all duration-300">
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
              className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/10 active:scale-[0.98] cursor-pointer"
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
        ) : (
          <div className="flex flex-col items-center">
            <button
              onClick={onOpenUpgradeModal}
              title="Storage & Plan (Click to upgrade)"
              className="group relative w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-amber-500 hover:border-amber-400/60 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              <Cloud className="w-[22px] h-[22px] text-amber-500 stroke-[2]" />
              <div className="hidden group-hover:flex flex-col absolute left-full ml-3 p-3 bg-neutral-900 text-white text-xs rounded-2xl shadow-2xl border border-neutral-800 whitespace-nowrap z-50 gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                <span className="font-bold text-neutral-200">Storage Usage</span>
                <span className="text-amber-400 font-mono font-semibold">
                  28.7 GB / {subscription.storageLimitGB} GB ({percentageUsed}%)
                </span>
                <span className="text-[10px] text-neutral-400">
                  {subscription.daysRemaining} days remaining
                </span>
                <span className="text-[10px] text-amber-400 font-bold mt-1">
                  Click to Upgrade Plan
                </span>
              </div>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
