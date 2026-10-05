import React, { useState, useEffect, useRef } from 'react';
import { Edit3, Check, X } from 'lucide-react';
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
  as: Component = 'span',
}) => {
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
      if ('select' in inputRef.current) {
        inputRef.current.select();
      }
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

  // Active inline edit mode
  if (isEditing) {
    return (
      <div className="relative inline-block w-full my-1 z-20">
        {label && (
          <span className="block text-[10px] font-mono uppercase tracking-wider text-amber-500 font-bold mb-1">
            Editing {label}:
          </span>
        )}
        <div className="flex items-start gap-2">
          {multiline ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={4}
              className={cn(
                'w-full px-3 py-2 rounded-xl bg-neutral-900/95 border-2 border-amber-400 text-white shadow-2xl focus:outline-none text-sm font-sans resize-y leading-relaxed',
                inputClassName
              )}
              placeholder={placeholder}
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              className={cn(
                'w-full px-3 py-1.5 rounded-xl bg-neutral-900/95 border-2 border-amber-400 text-white shadow-2xl focus:outline-none text-sm font-sans',
                inputClassName
              )}
              placeholder={placeholder}
            />
          )}

          <div className="flex flex-col gap-1 shrink-0">
            <button
              type="button"
              onClick={handleSave}
              className="p-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 shadow-md cursor-pointer transition-transform hover:scale-105"
              title="Save changes (Enter)"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white shadow-md cursor-pointer transition-transform hover:scale-105"
              title="Cancel (Esc)"
            >
              <X className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
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
        'rounded-md px-1 -mx-1 hover:ring-2 hover:ring-amber-400 hover:bg-amber-400/10 hover:shadow-sm'
      )}
      title={`Click to edit ${label || 'text'}`}
    >
      <Component className={className}>
        {value || <span className="opacity-40 italic">{placeholder}</span>}
      </Component>
      <span className="opacity-0 group-hover:opacity-100 absolute -top-3.5 -right-3.5 px-1.5 py-0.5 rounded-full bg-amber-400 text-neutral-950 font-mono text-[9px] font-bold flex items-center gap-1 shadow-lg pointer-events-none transition-all duration-150 z-30 scale-90 group-hover:scale-100">
        <Edit3 className="w-2.5 h-2.5" />
        <span>Edit</span>
      </span>
    </span>
  );
};
