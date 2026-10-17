import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export interface ModernDropdownOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: string;
}

export interface ModernDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: ModernDropdownOption[];
  placeholder?: string;
  theme?: 'editorial' | 'cinematic' | 'masonry' | 'minimal' | 'editorial-light' | string;
  leftIcon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  menuClassName?: string;
}

export const ModernDropdown: React.FC<ModernDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  theme = 'editorial',
  leftIcon,
  disabled = false,
  className = '',
  menuClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('pointerdown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  // Theme styling helpers
  const getThemeStyles = () => {
    switch (theme) {
      case 'cinematic':
        return {
          activeBorder: 'border-amber-400 ring-2 ring-amber-400/20 shadow-[0_0_20px_rgba(251,191,36,0.15)]',
          triggerBg: 'bg-neutral-900/90 border-neutral-800 hover:border-amber-500/40 text-white hover:bg-neutral-900',
          triggerActiveBg: 'bg-neutral-900/95',
          textSelected: 'text-white',
          textPlaceholder: 'text-neutral-500',
          menuBg: 'bg-[#0b0b12]/98 border-amber-500/30',
          selectedItem: 'bg-amber-400/15 text-amber-300 font-semibold border-amber-400/30',
          hoverItem: 'hover:bg-amber-400/10 hover:text-white',
          accentColor: 'text-amber-400',
          badgeStyle: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
          iconBg: 'bg-white/5 border-white/10 text-neutral-400',
          iconSelectedBg: 'bg-amber-400/20 border-amber-400/30 text-amber-300',
        };
      case 'masonry':
        return {
          activeBorder: 'border-emerald-400 ring-2 ring-emerald-400/20 shadow-[0_0_20px_rgba(52,211,153,0.15)]',
          triggerBg: 'bg-neutral-900/90 border-neutral-800 hover:border-emerald-500/40 text-white hover:bg-neutral-900',
          triggerActiveBg: 'bg-neutral-900/95',
          textSelected: 'text-white',
          textPlaceholder: 'text-neutral-500',
          menuBg: 'bg-[#07120c]/98 border-emerald-500/30',
          selectedItem: 'bg-emerald-400/15 text-emerald-300 font-semibold border-emerald-400/30',
          hoverItem: 'hover:bg-emerald-400/10 hover:text-white',
          accentColor: 'text-emerald-400',
          badgeStyle: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
          iconBg: 'bg-white/5 border-white/10 text-neutral-400',
          iconSelectedBg: 'bg-emerald-400/20 border-emerald-400/30 text-emerald-300',
        };
      case 'minimal':
        return {
          activeBorder: 'border-neutral-300 ring-2 ring-neutral-400/20 shadow-[0_0_20px_rgba(255,255,255,0.1)]',
          triggerBg: 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700 text-white hover:bg-neutral-900',
          triggerActiveBg: 'bg-neutral-900/95',
          textSelected: 'text-white',
          textPlaceholder: 'text-neutral-500',
          menuBg: 'bg-[#14151a]/98 border-neutral-700/60',
          selectedItem: 'bg-white/15 text-white font-semibold border-white/20',
          hoverItem: 'hover:bg-white/10 hover:text-white',
          accentColor: 'text-neutral-200',
          badgeStyle: 'bg-white/10 text-neutral-300 border-white/20',
          iconBg: 'bg-white/5 border-white/10 text-neutral-400',
          iconSelectedBg: 'bg-white/20 border-white/30 text-white',
        };
      case 'editorial-light':
        return {
          activeBorder: 'border-neutral-900 ring-2 ring-neutral-900/15 shadow-[0_0_20px_rgba(0,0,0,0.08)]',
          triggerBg: 'bg-neutral-50 border-neutral-200 hover:border-neutral-300 text-neutral-900 hover:bg-neutral-100/60',
          triggerActiveBg: 'bg-white',
          textSelected: 'text-neutral-900',
          textPlaceholder: 'text-neutral-400',
          menuBg: 'bg-white/98 border-neutral-200 shadow-2xl shadow-black/10',
          selectedItem: 'bg-neutral-100 text-neutral-900 font-semibold border-neutral-300',
          hoverItem: 'hover:bg-neutral-50 hover:text-neutral-900',
          accentColor: 'text-neutral-900',
          badgeStyle: 'bg-neutral-100 text-neutral-800 border-neutral-300',
          iconBg: 'bg-neutral-100 border-neutral-200 text-neutral-600',
          iconSelectedBg: 'bg-neutral-900 border-neutral-900 text-white',
        };
      case 'editorial':
      default:
        return {
          activeBorder: 'border-amber-400 ring-2 ring-amber-400/20 shadow-[0_0_20px_rgba(251,191,36,0.15)]',
          triggerBg: 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700 text-white hover:bg-neutral-900',
          triggerActiveBg: 'bg-neutral-900/95',
          textSelected: 'text-white',
          textPlaceholder: 'text-neutral-500',
          menuBg: 'bg-[#0f1016]/98 border-white/15',
          selectedItem: 'bg-amber-400/15 text-amber-200 font-semibold border-amber-400/30',
          hoverItem: 'hover:bg-white/10 hover:text-white',
          accentColor: 'text-amber-400',
          badgeStyle: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
          iconBg: 'bg-white/5 border-white/10 text-neutral-400',
          iconSelectedBg: 'bg-amber-400/20 border-amber-400/30 text-amber-200',
        };
    }
  };

  const t = getThemeStyles();

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full px-4 py-3 sm:py-3.5 rounded-2xl text-left text-sm flex items-center justify-between gap-3 transition-all duration-200 cursor-pointer select-none border ${
          isOpen
            ? `${t.activeBorder} ${t.triggerActiveBg}`
            : t.triggerBg
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Left Icon (passed or from option) */}
          {leftIcon ? (
            <span className={`shrink-0 transition-colors ${isOpen ? t.accentColor : 'text-neutral-400'}`}>
              {leftIcon}
            </span>
          ) : selectedOption?.icon ? (
            <span className={`shrink-0 transition-colors ${t.accentColor}`}>
              {selectedOption.icon}
            </span>
          ) : null}

          <span
            className={`truncate font-medium text-sm ${
              selectedOption && selectedOption.value !== ''
                ? t.textSelected
                : t.textPlaceholder
            }`}
          >
            {selectedOption && selectedOption.value !== '' ? selectedOption.label : placeholder}
          </span>

          {selectedOption?.badge && (
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider font-bold border shrink-0 ${t.badgeStyle}`}
            >
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-300 ${
            isOpen ? `rotate-180 ${t.accentColor}` : ''
          }`}
        />
      </button>

      {/* Popover Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute left-0 right-0 z-50 mt-2 p-1.5 rounded-2xl border shadow-2xl backdrop-blur-2xl max-h-72 overflow-y-auto overscroll-contain divide-y divide-white/5 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent ${t.menuBg} ${menuClassName}`}
          >
            <div className="space-y-1">
              {options.map((option) => {
                const isSelected = option.value === value;

                return (
                  <button
                    key={option.value || '__empty__'}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-left text-sm flex items-center justify-between gap-3 transition-all cursor-pointer border border-transparent ${
                      isSelected
                        ? t.selectedItem
                        : `text-neutral-300 ${t.hoverItem}`
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {option.icon && (
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                            isSelected ? t.iconSelectedBg : t.iconBg
                          }`}
                        >
                          {option.icon}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`block truncate text-sm ${
                              isSelected ? 'font-semibold' : 'font-medium'
                            }`}
                          >
                            {option.label}
                          </span>
                          {option.badge && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border shrink-0 ${t.badgeStyle}`}
                            >
                              {option.badge}
                            </span>
                          )}
                        </div>
                        {option.description && (
                          <span className="block text-[11px] text-neutral-400 font-light truncate mt-0.5">
                            {option.description}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div className={`shrink-0 ${t.accentColor}`}>
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
