import React from 'react';
import { Copy, Check } from 'lucide-react';

interface ShareUrlBarProps {
  url: string;
  onCopy: () => void;
  copied: boolean;
  label?: string;
}

export const ShareUrlBar: React.FC<ShareUrlBarProps> = ({
  url,
  onCopy,
  copied,
  label = 'Direct Shareable Link',
}) => {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
        {label}
      </label>
      <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-xl p-1.5">
        <input
          type="text"
          readOnly
          value={url}
          onClick={(e) => (e.target as HTMLInputElement).select()}
          className="bg-transparent text-xs text-neutral-200 flex-1 px-2.5 focus:outline-none select-all font-mono truncate"
        />
        <button
          onClick={onCopy}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
            copied
              ? 'bg-emerald-500 text-neutral-950 font-bold shadow-sm'
              : 'bg-neutral-800 hover:bg-neutral-700 text-white'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" /> Copied
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" /> Copy Link
            </>
          )}
        </button>
      </div>
    </div>
  );
};
