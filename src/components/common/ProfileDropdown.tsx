import React, { useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useGallery } from '../../context/GalleryContext';
import {
  Settings,
  ExternalLink,
  HelpCircle,
  LogOut,
  ChevronRight,
  Crown,
  Loader2,
} from 'lucide-react';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ isOpen, onClose }) => {
  const { photographer, logout, isLoggingOut } = useAuth();
  const { galleries } = useGallery();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSignOut = async () => {
    try {
      await logout();
    } finally {
      onClose();
      navigate('/login');
    }
  };

  const clientGallerySlug = galleries[0]?.slug || 'sarang-wedding-editorial';

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2.5 w-[320px] sm:w-[340px] max-w-[calc(100vw-24px)] rounded-2xl sm:rounded-3xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800/90 shadow-2xl shadow-neutral-950/20 dark:shadow-black/70 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 select-none transition-colors"
    >
      {/* Top Banner with Gold Curve Accent & User Info */}
      <div className="relative p-5 border-b border-neutral-200/80 dark:border-neutral-800/80 overflow-hidden bg-gradient-to-br from-neutral-50 to-white dark:from-[#151720] dark:to-[#101117]">
        {/* Abstract Gold Glow & Curve Vector matching the screenshot */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-amber-500/15 dark:bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
        <svg
          className="absolute top-0 right-0 w-36 h-28 pointer-events-none opacity-40 dark:opacity-60"
          viewBox="0 0 160 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M160 0C115 15 65 60 40 120"
            stroke="url(#profile-gold-1)"
            strokeWidth="1.5"
          />
          <path
            d="M160 22C125 36 82 72 65 120"
            stroke="url(#profile-gold-2)"
            strokeWidth="2"
          />
          <path
            d="M160 48C132 58 100 85 90 120"
            stroke="url(#profile-gold-1)"
            strokeWidth="1"
          />
          <defs>
            <linearGradient
              id="profile-gold-1"
              x1="160"
              y1="0"
              x2="40"
              y2="120"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#F59E0B" stopOpacity="0.9" />
              <stop offset="1" stopColor="#D97706" stopOpacity="0" />
            </linearGradient>
            <linearGradient
              id="profile-gold-2"
              x1="160"
              y1="22"
              x2="65"
              y2="120"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#FBBF24" stopOpacity="1" />
              <stop offset="1" stopColor="#B45309" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>

        {/* User Profile Info */}
        <div className="relative z-10 flex items-center gap-3.5">
          {/* Avatar with Ring & Emerald Online Status Dot */}
          <div className="relative shrink-0">
            <div className="w-13 h-13 rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-amber-400 to-amber-200/50 shadow-md">
              <img
                src={
                  photographer.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
                }
                alt={photographer.fullName || 'User Avatar'}
                className="w-full h-full rounded-full object-cover bg-neutral-900"
              />
            </div>
            {/* Green Online Indicator */}
            <span
              className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#121319]"
              title="Active session"
            />
          </div>

          {/* User Details */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white leading-tight truncate">
              {photographer.fullName || 'Sarang A'}
            </h4>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono truncate mt-0.5">
              {photographer.email || 'sarangsaru445@gmail.com'}
            </p>

            {/* Pro Member Badge */}
            <div className="mt-1.5 inline-flex items-center">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 shadow-xs">
                <Crown className="w-2.5 h-2.5 fill-amber-500/40 text-amber-500" />
                <span>Pro Member</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Menu List */}
      <div className="p-2 space-y-1">
        {/* 1. Personal Settings */}
        <Link
          to="/dashboard/settings"
          onClick={onClose}
          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors group cursor-pointer text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800/70 border border-neutral-200/80 dark:border-neutral-700/50 flex items-center justify-center text-neutral-600 dark:text-neutral-300 group-hover:text-amber-500 group-hover:border-amber-400/40 transition-colors shrink-0">
              <Settings className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Personal Settings
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight truncate mt-0.5">
                Manage your personal info and preferences
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </Link>

        {/* 2. Public Client View */}
        <Link
          to={`/gallery/${clientGallerySlug}`}
          target="_blank"
          onClick={onClose}
          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors group cursor-pointer text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800/70 border border-neutral-200/80 dark:border-neutral-700/50 flex items-center justify-center text-neutral-600 dark:text-neutral-300 group-hover:text-amber-500 group-hover:border-amber-400/40 transition-colors shrink-0">
              <ExternalLink className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Public Client View
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight truncate mt-0.5">
                See how your clients experience your galleries
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </Link>

        {/* 3. Help & Support */}
        <Link
          to="/dashboard/tutorials"
          onClick={onClose}
          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors group cursor-pointer text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:border-amber-400/60 transition-colors shrink-0">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Help & Support
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight truncate mt-0.5">
                Get help or contact support
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </Link>

        {/* 4. Sign Out */}
        <button
          onClick={handleSignOut}
          disabled={isLoggingOut}
          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors group cursor-pointer text-left disabled:opacity-50"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              {isLoggingOut ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                {isLoggingOut ? 'Signing out...' : 'Sign Out'}
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight truncate mt-0.5">
                See you again soon
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
