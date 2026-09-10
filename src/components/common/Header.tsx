import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useGallery } from '../../context/GalleryContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Camera,
  Sun,
  Moon,
  Bell,
  ChevronDown,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
} from 'lucide-react';

interface HeaderProps {
  onOpenMobileMenu?: () => void;
  onOpenCreateModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { photographer, logout } = useAuth();
  const { galleries } = useGallery();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 w-full bg-white dark:bg-[#0c0d12] border-b border-neutral-200 dark:border-neutral-800/90 px-4 sm:px-6 flex items-center justify-between gap-4 select-none shrink-0 z-30 transition-colors">
      {/* Left: Studio Brand & Logo */}
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger */}
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/dashboard/drive" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center text-neutral-950 shadow-md group-hover:scale-105 transition-transform shrink-0">
            <Camera className="w-5 h-5 stroke-[2.4]" />
          </div>
          <div className="min-w-0">
            <span className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white block leading-tight font-sans">
              EX STUDIO
            </span>
            <span className="text-[9px] tracking-[0.22em] font-semibold text-neutral-500 dark:text-neutral-400 uppercase block">
              PHOTOGRAPHY
            </span>
          </div>
        </Link>
      </div>

      {/* Flexible spacer */}
      <div className="flex-1" />

      {/* Right Controls: Dark/Light Mode Toggle, Notifications, User Profile */}
      <div className="flex items-center gap-3">
        {/* Dark / Light Mode Switch Pill */}
        <button
          onClick={toggleTheme}
          className="flex items-center p-1 rounded-full bg-neutral-100 dark:bg-[#161822] border border-neutral-200 dark:border-neutral-800 transition-colors shadow-xs"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          <div
            className={`p-1.5 rounded-full transition-all flex items-center justify-center ${
              theme === 'light'
                ? 'bg-amber-400 text-neutral-950 shadow-sm scale-105'
                : 'text-neutral-400 hover:text-neutral-600'
            }`}
          >
            <Sun className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
          <div
            className={`p-1.5 rounded-full transition-all flex items-center justify-center ${
              theme === 'dark'
                ? 'bg-neutral-800 text-amber-400 shadow-sm scale-105'
                : 'text-neutral-400 hover:text-neutral-600'
            }`}
          >
            <Moon className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
        </button>

        {/* Notification Bell with Badge */}
        <div className="relative">
          <button
            className="p-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white dark:ring-[#0c0d12]" />
          </button>
        </div>

        {/* User Profile with Avatar & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2.5 pl-1.5 pr-2 py-1 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
          >
            <img
              src={photographer.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
              alt={photographer.fullName}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-amber-400/60"
            />
            <span className="hidden sm:inline text-xs font-semibold text-neutral-900 dark:text-white">
              {photographer.fullName || 'Sarang Varma'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
          </button>

          {/* Profile Dropdown Menu */}
          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#14161f] border border-neutral-200 dark:border-neutral-800 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800/80">
                <p className="text-xs font-semibold text-neutral-900 dark:text-white">
                  {photographer.fullName}
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">{photographer.email}</p>
              </div>

              <div className="py-1">
                <Link
                  to="/dashboard/settings"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Studio Settings</span>
                </Link>

                <Link
                  to={`/gallery/${galleries[0]?.slug || 'sarang-wedding-editorial'}`}
                  target="_blank"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Public Client View</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-neutral-200 dark:border-neutral-800/80">
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
