import React, { useState } from 'react';
import type { PortfolioConfig } from '../../../types/portfolio';
import { getPortfolioTemplate } from '../templates/PortfolioTemplateRegistry';
import {
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Maximize2,
} from 'lucide-react';

interface PortfolioDevicePreviewProps {
  config: PortfolioConfig;
  portfolioId: string;
}

export const PortfolioDevicePreview: React.FC<PortfolioDevicePreviewProps> = ({
  config,
  portfolioId,
}) => {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [key, setKey] = useState(0);

  const TemplateComponent = getPortfolioTemplate(config.templateId);

  const handleRefresh = () => {
    setKey((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col h-full rounded-3xl bg-neutral-100 dark:bg-[#0c0d12] border border-neutral-200 dark:border-neutral-800/90 overflow-hidden shadow-sm">
      {/* Device Toolbar Header */}
      <div className="px-4 py-3 bg-white dark:bg-[#13151f] border-b border-neutral-200 dark:border-neutral-800/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <button
              onClick={() => setDeviceMode('desktop')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                deviceMode === 'desktop'
                  ? 'bg-white dark:bg-neutral-800 text-amber-500 dark:text-amber-400 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title="Desktop View"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Desktop</span>
            </button>

            <button
              onClick={() => setDeviceMode('tablet')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                deviceMode === 'tablet'
                  ? 'bg-white dark:bg-neutral-800 text-amber-500 dark:text-amber-400 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title="Tablet View"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tablet</span>
            </button>

            <button
              onClick={() => setDeviceMode('mobile')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                deviceMode === 'mobile'
                  ? 'bg-white dark:bg-neutral-800 text-amber-500 dark:text-amber-400 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title="Mobile View"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mobile</span>
            </button>
          </div>

          <span className="text-[11px] font-mono text-neutral-400 hidden md:inline">
            {deviceMode === 'desktop' ? '100% Fluid' : deviceMode === 'tablet' ? '768px • iPad' : '390px • iPhone'}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors"
            title="Reload Preview"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <a
            href={`/portfolio/${portfolioId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>Open Live Tab</span>
          </a>
        </div>
      </div>

      {/* Device Frame Viewport Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex items-start justify-center custom-scrollbar bg-neutral-200/50 dark:bg-[#07080b]">
        {deviceMode === 'desktop' && (
          <div key={key} className="w-full bg-white dark:bg-[#0c0d12] rounded-2xl shadow-xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
            <TemplateComponent config={config} isPreview />
          </div>
        )}

        {deviceMode === 'tablet' && (
          <div
            key={key}
            className="w-[768px] max-w-full bg-white dark:bg-[#0c0d12] rounded-[36px] shadow-2xl overflow-hidden border-[10px] border-neutral-900 dark:border-neutral-800/90 ring-1 ring-white/10 my-4"
          >
            {/* Tablet Camera / Speaker Notch */}
            <div className="h-4 bg-neutral-900 dark:bg-neutral-800/90 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-neutral-800 dark:bg-neutral-900" />
            </div>
            <div className="max-h-[85vh] overflow-y-auto custom-scrollbar">
              <TemplateComponent config={config} isPreview />
            </div>
          </div>
        )}

        {deviceMode === 'mobile' && (
          <div
            key={key}
            className="w-[390px] max-w-full bg-white dark:bg-[#0c0d12] rounded-[48px] shadow-2xl overflow-hidden border-[12px] border-neutral-900 dark:border-neutral-800/90 ring-1 ring-white/10 my-4"
          >
            {/* Dynamic Island / iPhone Notch */}
            <div className="pt-2 pb-1 bg-neutral-900 dark:bg-neutral-800/90 flex items-center justify-center">
              <div className="w-28 h-4 rounded-full bg-black flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-neutral-900" />
              </div>
            </div>
            <div className="max-h-[80vh] overflow-y-auto custom-scrollbar">
              <TemplateComponent config={config} isPreview />
            </div>
            <div className="h-4 bg-neutral-900 dark:bg-neutral-800/90 flex items-center justify-center">
              <div className="w-32 h-1 rounded-full bg-neutral-700" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
