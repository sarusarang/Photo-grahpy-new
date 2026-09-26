import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AnimatedThemeToggler } from '../ui/animated-theme-toggler';
import { ProfileDropdown } from './ProfileDropdown';
import { NotificationDropdown } from './NotificationDropdown';
import { Logo } from './Logo';
import {
  Bell,
  ChevronDown,
  Menu,
} from 'lucide-react';

interface HeaderProps {
  onOpenMobileMenu?: () => void;
  onOpenCreateModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { photographer, user } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(3);


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

        <Link to="/dashboard/gallery" className="flex items-center group py-1" title="EX SHARE Dashboard">
          <Logo variant="auto" className="h-6 sm:h-7 w-auto object-contain transition-transform group-hover:scale-105" />
        </Link>
      </div>

      {/* Flexible spacer */}
      <div className="flex-1" />



      {/* Right Controls: Dark/Light Mode Toggle, Notifications, User Profile */}
      <div className="flex items-center gap-3">
      
      
        {/* Animated Theme Toggler (replacing old toggle code) */}
        <AnimatedThemeToggler />


        {/* Notification Bell with Badge & Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setNotificationsOpen((prev) => !prev);
              setProfileDropdownOpen(false);
            }}
            className={`p-2 rounded-xl transition-colors relative cursor-pointer ${
              notificationsOpen
                ? 'bg-amber-500/15 text-amber-500 ring-1 ring-amber-400/40'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
            }`}
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-amber-400 text-neutral-950 font-mono font-bold text-[9px] flex items-center justify-center ring-2 ring-white dark:ring-[#0c0d12] shadow-xs">
                {unreadCount}
              </span>
            ) : (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-600 opacity-60" />
            )}
          </button>

          <NotificationDropdown
            isOpen={notificationsOpen}
            onClose={() => setNotificationsOpen(false)}
            onUnreadCountChange={(count) => setUnreadCount(count)}
          />
        </div>

        {/* User Profile with Avatar & Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setProfileDropdownOpen((prev) => !prev);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-2.5 pl-1.5 pr-2 py-1 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
          >
            {photographer.avatarUrl ? (
              <img
                src={photographer.avatarUrl}
                alt={photographer.fullName || user?.username || 'User'}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-amber-400/60"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-500 font-bold text-xs flex items-center justify-center ring-2 ring-amber-400/60 uppercase">
                {(photographer.fullName || user?.username || 'U').charAt(0)}
              </div>
            )}
            <span className="hidden sm:inline text-xs font-semibold text-neutral-900 dark:text-white">
              {photographer.fullName || user?.username || 'User'}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 transition-transform duration-200 ${
                profileDropdownOpen ? 'rotate-180 text-amber-500' : ''
              }`}
            />
          </button>

          {/* New Exact-Match Profile Dropdown Component */}
          <ProfileDropdown
            isOpen={profileDropdownOpen}
            onClose={() => setProfileDropdownOpen(false)}
          />
        </div>
      </div>
    </header>
  );
};
