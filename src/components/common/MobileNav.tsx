import React from 'react';
import { NavLink } from 'react-router-dom';
import { FolderKanban, GraduationCap, Settings as SettingsIcon } from 'lucide-react';
import { useGallery } from '../../context/GalleryContext';

export const MobileNav: React.FC = () => {
  const { galleries } = useGallery();

  const navItems = [
    {
      to: '/dashboard/drive',
      label: 'Drive',
      icon: FolderKanban,
      badge: galleries.length.toString(),
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

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-md border-t border-neutral-800/80 px-4 py-2 flex items-center justify-around">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1 px-4 rounded-xl text-xs font-medium transition-colors relative ${
                isActive ? 'text-amber-400 font-semibold' : 'text-neutral-400 hover:text-neutral-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-amber-400' : 'text-neutral-400'}`} />
                  {item.badge && (
                    <span className="absolute -top-1 -right-2 px-1 text-[9px] bg-amber-500 text-neutral-950 font-bold rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </div>
  );
};
