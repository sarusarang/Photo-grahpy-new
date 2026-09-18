import React from 'react';

interface ClientGalleryFooterProps {
  galleryTitle: string;
  studioName?: string;
  mediaCount?: number;
  theme?: 'editorial' | 'cinematic' | 'minimal' | 'masonry';
}

export const ClientGalleryFooter: React.FC<ClientGalleryFooterProps> = ({
  galleryTitle,
  studioName = 'EX SHARE',
  mediaCount,
  theme = 'editorial',
}) => {

  const getThemeStyles = () => {
    switch (theme) {
      case 'cinematic':
        return {
          wrapper: 'border-t border-neutral-800/80 bg-[#030304] text-neutral-300',
          studio: 'text-amber-400 font-serif',
          title: 'text-neutral-400',
          dot: 'text-neutral-700',
          curated: 'text-neutral-400',
          byExShare: 'text-neutral-400 hover:text-neutral-200',
          button:
            'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 shadow-2xs',
        };
      case 'masonry':
        return {
          wrapper: 'border-t border-emerald-950/70 bg-[#070D0B] text-neutral-300',
          studio: 'text-emerald-400 font-serif',
          title: 'text-neutral-400',
          dot: 'text-emerald-900',
          curated: 'text-neutral-400',
          byExShare: 'text-emerald-400/90 hover:text-emerald-300',
          button:
            'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300/80 hover:text-emerald-200 border border-emerald-900/60 shadow-2xs',
        };
      case 'minimal':
        return {
          wrapper: 'border-t border-neutral-200/90 bg-[#F5F5F2] text-neutral-900',
          studio: 'text-neutral-900 font-serif',
          title: 'text-neutral-600',
          dot: 'text-neutral-300',
          curated: 'text-neutral-500',
          byExShare: 'text-neutral-600 hover:text-neutral-900',
          button:
            'bg-neutral-200/80 hover:bg-neutral-300/80 text-neutral-700 hover:text-neutral-950 border border-neutral-300/60 shadow-2xs',
        };
      case 'editorial':
      default:
        return {
          wrapper: 'border-t border-neutral-200/80 bg-white/95 backdrop-blur-sm text-neutral-900',
          studio: 'text-neutral-900 font-serif',
          title: 'text-neutral-600',
          dot: 'text-neutral-300',
          curated: 'text-neutral-500',
          byExShare: 'text-neutral-600 hover:text-neutral-900',
          button:
            'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-neutral-950 border border-neutral-200/80 shadow-2xs',
        };
    }
  };

  const st = getThemeStyles();
  const isDark = theme === 'cinematic' || theme === 'masonry';

  return (
    <footer className={`${st.wrapper} py-5 sm:py-6 px-4 sm:px-8 transition-colors select-none`}>
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-3 items-center gap-4 text-center md:text-left">
        {/* Left: Studio & Collection Details */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 min-w-0">
          <span className={`text-xs font-serif font-bold uppercase tracking-wider ${st.studio} shrink-0`}>
            {studioName}
          </span>
          <span className={`text-xs ${st.dot}`}>•</span>
          <span className={`text-xs font-medium truncate max-w-[200px] lg:max-w-xs ${st.title}`} title={galleryTitle}>
            {galleryTitle}
          </span>
        </div>

        {/* Center: Curated & Archival Details (True Geometric Center) */}
        <div className={`flex items-center justify-center gap-2 text-xs tracking-wide ${st.curated}`}>
          <span className="font-normal">Curated in full museum resolution</span>
          {typeof mediaCount === 'number' && (
            <>
              <span className={st.dot}>•</span>
              <span className="font-medium tabular-nums">{mediaCount} {mediaCount === 1 ? 'item' : 'items'}</span>
            </>
          )}
        </div>

        {/* Right: by EX SHARE branding + Back to top */}
        <div className="flex items-center justify-center md:justify-end gap-3.5 sm:gap-4 shrink-0">
          {/* by EX SHARE branding badge */}
          <div
            className={`inline-flex items-center gap-1.5 text-xs transition-opacity ${st.byExShare}`}
            title="Delivered by EX SHARE"
          >
            <span className="text-[11px] font-normal tracking-wide opacity-65">by</span>
            <div className="flex items-center gap-1">
              <img
                src={isDark ? '/ex-share-white-logo.png' : '/ex-share-balck-logo.png'}
                alt="EX SHARE"
                className="h-3.5 w-auto object-contain opacity-85 hover:opacity-100 transition-opacity"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
