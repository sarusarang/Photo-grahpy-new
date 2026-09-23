import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FolderKanban,
  GraduationCap,
  Settings as SettingsIcon,
  LayoutGrid,
  Plus,
  Calendar,
} from 'lucide-react';
import { useGallery } from '../../context/GalleryContext';
import { useEvent } from '../../context/EventContext';

interface MobileNavProps {
  onOpenCreateModal?: () => void;
  onOpenTemplatesSheet?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  onOpenCreateModal,
  onOpenTemplatesSheet,
}) => {
  const { galleries } = useGallery();
  const { activeLiveEvents } = useEvent();

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-[#0c0d12]/92 backdrop-blur-xl border-t border-neutral-200/90 dark:border-neutral-800/80 px-2 pt-1.5 pb-safe flex items-center justify-around shadow-2xl transition-colors"
    >
      {/* 1. Drive Tab */}
      <NavLink
        to="/dashboard/drive"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center min-w-[50px] py-1 rounded-2xl text-[10px] font-medium transition-all active:scale-90 select-none ${
            isActive
              ? 'text-amber-500 font-bold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <div className="relative p-1">
              <FolderKanban
                className={`w-5 h-5 transition-transform ${
                  isActive ? 'text-amber-500 scale-105 stroke-[2.3]' : 'text-neutral-500 dark:text-neutral-400'
                }`}
              />
              {galleries.length > 0 && (
                <span className="absolute -top-0.5 -right-1 px-1.5 py-0.2 min-w-[15px] text-center text-[9px] bg-amber-400 text-neutral-950 font-bold font-mono rounded-full ring-2 ring-white dark:ring-[#0c0d12]">
                  {galleries.length}
                </span>
              )}
            </div>
            <span className="tracking-tight">Drive</span>
          </>
        )}
      </NavLink>

      {/* 2. Events Tab (with Live indicator) */}
      <NavLink
        to="/dashboard/events"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center min-w-[50px] py-1 rounded-2xl text-[10px] font-medium transition-all active:scale-90 select-none ${
            isActive
              ? 'text-amber-500 font-bold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <div className="relative p-1">
              <Calendar
                className={`w-5 h-5 transition-transform ${
                  isActive ? 'text-amber-500 scale-105 stroke-[2.3]' : 'text-neutral-500 dark:text-neutral-400'
                }`}
              />
              {activeLiveEvents.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping ring-2 ring-white dark:ring-[#0c0d12]" />
              )}
            </div>
            <span className="tracking-tight">Events</span>
          </>
        )}
      </NavLink>

      {/* 2. Templates Tab */}
      <button
        onClick={onOpenTemplatesSheet}
        className="flex flex-col items-center justify-center min-w-[56px] py-1 rounded-2xl text-[10px] font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all active:scale-90 select-none cursor-pointer"
      >
        <div className="p-1">
          <LayoutGrid className="w-5 h-5" />
        </div>
        <span className="tracking-tight">Templates</span>
      </button>

      {/* 3. Center Create Gallery Quick Action Button */}
      {onOpenCreateModal && (
        <button
          onClick={onOpenCreateModal}
          className="relative -top-2 w-11 h-11 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-neutral-950 flex items-center justify-center shadow-lg shadow-amber-500/25 active:scale-90 hover:scale-105 transition-transform cursor-pointer ring-4 ring-white dark:ring-[#0c0d12]"
          title="Create New Gallery"
          aria-label="Create New Gallery"
        >
          <Plus className="w-5 h-5 stroke-[2.8]" />
        </button>
      )}

      {/* 4. Tutorial Tab */}
      <NavLink
        to="/dashboard/tutorials"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center min-w-[56px] py-1 rounded-2xl text-[10px] font-medium transition-all active:scale-90 select-none ${
            isActive
              ? 'text-amber-500 font-bold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <div className="p-1">
              <GraduationCap
                className={`w-5 h-5 transition-transform ${
                  isActive ? 'text-amber-500 scale-105 stroke-[2.3]' : 'text-neutral-500 dark:text-neutral-400'
                }`}
              />
            </div>
            <span className="tracking-tight">Tutorial</span>
          </>
        )}
      </NavLink>

      {/* 5. Settings Tab */}
      <NavLink
        to="/dashboard/settings"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center min-w-[56px] py-1 rounded-2xl text-[10px] font-medium transition-all active:scale-90 select-none ${
            isActive
              ? 'text-amber-500 font-bold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <div className="p-1">
              <SettingsIcon
                className={`w-5 h-5 transition-transform ${
                  isActive ? 'text-amber-500 scale-105 stroke-[2.3]' : 'text-neutral-500 dark:text-neutral-400'
                }`}
              />
            </div>
            <span className="tracking-tight">Settings</span>
          </>
        )}
      </NavLink>
    </nav>
  );
};
