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
        className={`w-full px-4 py-2.5 rounded-xl text-left text-sm flex items-center justify-between gap-2 transition-all duration-200 cursor-pointer ${
          isOpen
            ? 'bg-white dark:bg-[#121319] border-amber-400 dark:border-amber-400 ring-2 ring-amber-400/20 shadow-md'
            : 'bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2.5 truncate">
          {selectedOption?.icon && (
            <span className="text-amber-500 shrink-0">{selectedOption.icon}</span>
          )}
          <span
            className={`truncate font-medium ${
              selectedOption
                ? 'text-neutral-900 dark:text-white'
                : 'text-neutral-400 dark:text-neutral-500'
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-amber-500' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 z-50 mt-1.5 p-1.5 rounded-2xl bg-white dark:bg-[#15161f] border border-neutral-200 dark:border-neutral-800 shadow-2xl shadow-black/10 dark:shadow-black/50 backdrop-blur-xl max-h-64 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-150 ${dropdownClassName}`}
        >
          <div className="space-y-0.5">
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-3 py-2 rounded-xl text-left text-xs sm:text-sm flex items-center justify-between gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400/15 text-amber-700 dark:text-amber-300 font-semibold'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {option.icon && (
                      <span
                        className={`shrink-0 ${
                          isSelected ? 'text-amber-500' : 'text-neutral-400'
                        }`}
                      >
                        {option.icon}
                      </span>
                    )}
                    <div className="truncate">
                      <span className="block truncate">{option.label}</span>
                      {option.description && (
                        <span className="block text-[11px] text-neutral-400 dark:text-neutral-500 font-mono truncate">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {option.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
                        {option.badge}
                      </span>
                    )}
                    {isSelected && (
                      <Check className="w-4 h-4 text-amber-500 stroke-[2.5]" />
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
