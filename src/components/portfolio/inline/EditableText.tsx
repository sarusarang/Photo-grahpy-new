import React, { useState, useEffect, useRef } from 'react';
import { Edit3, Check, X, Sparkles } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface EditableTextProps {
  value: string;
  onSave: (newValue: string) => void;
  isEditable?: boolean;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  label?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
}

export const EditableText: React.FC<EditableTextProps> = ({
  value,
  onSave,
  isEditable = false,
  multiline = false,
  placeholder = 'Click to edit...',
  className = '',
  inputClassName = '',
  label,
  as: asTag = 'span',
}) => {
  const Component = asTag;
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const [prevValue, setPrevValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  if (prevValue !== value) {
    setPrevValue(value);
    setDraft(value || '');
  }

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = draft.trim();
    if (trimmed !== value) {
      onSave(trimmed);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft(value || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // If not editable, render regular text
  if (!isEditable) {
    return <Component className={className}>{value || placeholder}</Component>;
  }

  // Determine whether this text is a major heading/title (e.g. Studio Name, Hero Title)
  const isHeading = Boolean(
    !multiline &&
      (asTag === 'h1' ||
        asTag === 'h2' ||
        asTag === 'h3' ||
        label?.toLowerCase().includes('name') ||
        label?.toLowerCase().includes('title') ||
        className?.includes('text-4xl') ||
        className?.includes('text-5xl') ||
        className?.includes('text-6xl') ||
        className?.includes('text-7xl') ||
        className?.includes('text-8xl'))
  );

  // Active inline edit mode
  if (isEditing) {
    // ─── 1. LUXURY TITLE / HEADING INLINE EDITOR ──────────────────────────
    if (isHeading) {
      return (
        <div className="relative inline-block w-full max-w-4xl mx-auto my-2 z-30 animate-in fade-in zoom-in-95 duration-200 normal-case font-normal drop-shadow-none tracking-normal">
          <div className="relative p-6 sm:p-8 rounded-3xl bg-neutral-950/95 border border-white/15 backdrop-blur-2xl shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_50px_rgba(251,191,36,0.12)] flex flex-col items-center text-center">
            {/* Header Badge */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-mono font-bold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Edit {label || 'Title'}</span>
              </span>
            </div>

            {/* Title Input Field (Centered, Majestic Typography) */}
            <div className="w-full">
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                className={cn(
                  'w-full px-5 py-3 sm:py-4 rounded-2xl bg-white/[0.04] border border-amber-400/60 focus:border-amber-400 text-white text-center font-black tracking-tight focus:outline-none focus:ring-4 focus:ring-amber-400/20 transition-all leading-normal',
                  'text-3xl sm:text-5xl md:text-6xl',
                  className?.includes('uppercase') && 'uppercase',
                  className?.includes('font-serif') ? 'font-serif' : 'font-sans',
                  inputClassName
                )}
                placeholder={placeholder}
              />
            </div>

            {/* Action Buttons Toolbar Below */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
              <button
                type="button"
                onClick={handleSave}
                className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-400/25 cursor-pointer transition-all"
                title="Save changes (Enter)"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Save Changes</span>
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all border border-white/10"
                title="Cancel (Esc)"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
              <span className="text-xs text-neutral-400 font-sans hidden sm:inline ml-2">
                Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-neutral-300 font-mono text-[10px]">Enter ↵</kbd> to save
              </span>
            </div>
          </div>
        </div>
      );
    }

    // ─── 2. MULTILINE DESCRIPTION / STORY EDITOR ──────────────────────────
    if (multiline) {
      return (
        <div className="relative inline-block w-full max-w-2xl mx-auto my-2 z-30 text-left animate-in fade-in duration-150 normal-case font-normal drop-shadow-none tracking-normal">
          <div className="p-6 rounded-3xl bg-neutral-950/95 border border-white/15 backdrop-blur-2xl shadow-2xl space-y-3">
            {label && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-mono uppercase tracking-widest font-semibold">
                  <Edit3 className="w-3 h-3 text-amber-400" />
                  <span>Edit {label}</span>
                </span>
              </div>
            )}
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={4}
              className={cn(
                'w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-amber-400/60 focus:border-amber-400 text-white shadow-inner focus:outline-none focus:ring-4 focus:ring-amber-400/20 text-sm sm:text-base font-sans resize-y leading-relaxed',
                inputClassName
              )}
              placeholder={placeholder}
            />
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-400/20 cursor-pointer transition-all"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Save</span>
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all border border-white/10"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
              <span className="text-xs text-neutral-400 font-sans hidden sm:inline ml-auto">
                Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-neutral-300 font-mono text-[10px]">Esc</kbd> to cancel
              </span>
            </div>
          </div>
        </div>
      );
    }

    // ─── 3. COMPACT INLINE SINGLE-LINE EDITOR (Chips, Location, etc.) ─────
    return (
      <div className="relative inline-flex items-center gap-2 my-1 z-30 animate-in fade-in duration-150 normal-case font-normal drop-shadow-none tracking-normal">
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            'px-3.5 py-1.5 rounded-xl bg-neutral-950/95 border border-amber-400/60 focus:border-amber-400 text-white shadow-xl focus:outline-none focus:ring-2 focus:ring-amber-400/30 text-xs sm:text-sm font-sans',
            inputClassName
          )}
          placeholder={placeholder}
        />
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleSave}
            className="p-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 active:scale-95 text-neutral-950 shadow-md cursor-pointer transition-all"
            title="Save changes (Enter)"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-neutral-300 hover:text-white shadow-md cursor-pointer transition-all border border-white/10"
            title="Cancel (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Hoverable inline trigger
  return (
    <span
      onClick={() => setIsEditing(true)}
      className={cn(
        'group relative inline-block cursor-pointer transition-all duration-200',
        'rounded-2xl px-2.5 py-1 -mx-2 hover:ring-2 hover:ring-amber-400/80 hover:bg-amber-400/10 hover:shadow-lg'
      )}
      title={`Click to edit ${label || 'text'}`}
    >
      <Component className={className}>
        {value || <span className="opacity-40 italic">{placeholder}</span>}
      </Component>
      <span className="opacity-0 group-hover:opacity-100 absolute -top-3.5 -right-3.5 px-2 py-0.5 rounded-full bg-amber-400 text-neutral-950 font-mono text-[10px] font-bold flex items-center gap-1 shadow-lg pointer-events-none transition-all duration-150 z-30 scale-90 group-hover:scale-100">
        <Edit3 className="w-2.5 h-2.5" />
        <span>Edit</span>
      </span>
    </span>
  );
};
