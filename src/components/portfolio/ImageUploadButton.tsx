import React, { useRef } from 'react';
import { UploadCloud, X } from 'lucide-react';

interface ImageUploadButtonProps {
  value: string; // current image url / data url
  onChange: (url: string) => void;
  label?: string;
  aspectHint?: string; // e.g. "16:9 recommended"
  className?: string;
}

export const ImageUploadButton: React.FC<ImageUploadButtonProps> = ({
  value,
  onChange,
  label = 'Upload Image',
  aspectHint,
  className = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) onChange(result);
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            {label}
          </label>
          {aspectHint && (
            <span className="text-[10px] font-mono text-neutral-400">{aspectHint}</span>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {value ? (
        // Preview with clear button
        <div className="relative group rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
          <img
            src={value}
            alt="Uploaded preview"
            className="w-full h-32 object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-white/90 text-neutral-900 text-xs font-semibold flex items-center gap-1.5 transition-all hover:bg-white cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Replace
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-lg bg-rose-500/90 text-white text-xs flex items-center gap-1.5 transition-all hover:bg-rose-500 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        // Upload drop zone
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full h-28 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-amber-400 dark:hover:border-amber-400 bg-neutral-50 dark:bg-neutral-900/50 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 group-hover:bg-amber-400/10 flex items-center justify-center transition-colors">
            <UploadCloud className="w-5 h-5 text-neutral-400 group-hover:text-amber-500 transition-colors" />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              Click to upload from device
            </p>
            <p className="text-[10px] text-neutral-400 mt-0.5">PNG, JPG, WEBP supported</p>
          </div>
        </button>
      )}
    </div>
  );
};
