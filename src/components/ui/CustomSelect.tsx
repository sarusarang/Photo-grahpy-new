import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface CustomSelectOption<T = string | number> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: string;
}

interface CustomSelectProps<T = string | number> {
  value: T;
  onChange: (val: T) => void;
  options: CustomSelectOption<T>[];
  placeholder?: string;
  className?: string;
  dropdownClassName?: string;
  disabled?: boolean;
}

export function CustomSelect<T extends string | number>({
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  className = '',
  dropdownClassName = '',
  disabled = false,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close when clicking outside
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
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (val: T) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full px-3.5 py-2.5 sm:px-4 sm:py-2.5 rounded-xl text-left text-sm flex items-center justify-between gap-2.5 transition-all duration-200 cursor-pointer ${
          isOpen
            ? 'bg-white dark:bg-[#10111a] border-amber-400 dark:border-amber-400 ring-4 ring-amber-400/15 shadow-[0_0_25px_rgba(251,191,36,0.12)]'
            : 'bg-white dark:bg-gradient-to-b dark:from-[#13141e]/90 dark:to-[#0c0d14]/90 border border-neutral-200/90 dark:border-white/[0.085] hover:border-neutral-300 dark:hover:border-white/20 hover:bg-neutral-50/50 dark:hover:bg-[#12131d] shadow-xs dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.04),0_2px_4px_rgba(0,0,0,0.25)]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2.5 truncate">
          {selectedOption?.icon && (
            <span className="text-amber-500 shrink-0 transition-transform duration-200 group-hover:scale-105">
              {selectedOption.icon}
            </span>
          )}
          <span
            className={`truncate font-medium text-xs sm:text-sm ${
              selectedOption
                ? 'text-neutral-900 dark:text-neutral-100 font-semibold'
                : 'text-neutral-400 dark:text-neutral-500'
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0 transition-all duration-300 ${
            isOpen ? 'rotate-180 text-amber-500 scale-110' : 'group-hover:text-neutral-300'
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 z-50 mt-2 p-1.5 rounded-2xl bg-white/95 dark:bg-[#11121c]/98 border border-neutral-200/80 dark:border-white/[0.12] shadow-2xl shadow-black/20 dark:shadow-black/60 backdrop-blur-2xl max-h-64 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-150 ${dropdownClassName}`}
        >
          <div className="space-y-1">
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-3 py-2.5 rounded-xl text-left text-xs sm:text-sm flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400/15 text-amber-900 dark:text-amber-300 font-bold ring-1 ring-amber-400/30'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.06] hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {option.icon && (
                      <span
                        className={`shrink-0 transition-colors ${
                          isSelected ? 'text-amber-500' : 'text-neutral-400 group-hover:text-amber-400'
                        }`}
                      >
                        {option.icon}
                      </span>
                    )}
                    <div className="truncate">
                      <span className="block truncate font-medium">{option.label}</span>
                      {option.description && (
                        <span className="block text-[11px] text-neutral-400 dark:text-neutral-500 font-mono truncate mt-0.5">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {option.badge && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-neutral-100 dark:bg-white/[0.06] text-neutral-500 dark:text-neutral-400 border border-neutral-200/60 dark:border-white/[0.05]">
                        {option.badge}
                      </span>
                    )}
                    {isSelected && (
                      <Check className="w-4 h-4 text-amber-500 stroke-[2.5] drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
