import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Sparkles } from 'lucide-react';

export interface GalleryFloatingContactButtonProps {
  onOpenContact: () => void;
  theme?: 'editorial' | 'cinematic' | 'masonry' | 'minimal' | string;
  studioName?: string;
  visible?: boolean;
}

export const GalleryFloatingContactButton: React.FC<GalleryFloatingContactButtonProps> = ({
  onOpenContact,
  theme = 'editorial',
  studioName = 'Studio',
  visible = true,
}) => {
  if (!visible) return null;

  const getThemeStyles = () => {
    switch (theme) {
      case 'cinematic':
        return {
          pill: 'bg-neutral-950/90 text-amber-300 border-amber-400/40 hover:border-amber-300 shadow-amber-500/10 hover:shadow-amber-500/25',
          dot: 'bg-amber-400 shadow-amber-400/60',
          icon: 'text-amber-400',
          accentText: 'text-amber-400',
        };
      case 'masonry':
        return {
          pill: 'bg-[#070e0b]/90 text-emerald-300 border-emerald-500/40 hover:border-emerald-400 shadow-emerald-500/10 hover:shadow-emerald-500/25',
          dot: 'bg-emerald-400 shadow-emerald-400/60',
          icon: 'text-emerald-400',
          accentText: 'text-emerald-400',
        };
      case 'minimal':
        return {
          pill: 'bg-[#18181b]/90 text-neutral-200 border-neutral-700/80 hover:border-neutral-500 shadow-black/30',
          dot: 'bg-neutral-300 shadow-white/30',
          icon: 'text-neutral-300',
          accentText: 'text-white',
        };
      case 'editorial':
      default:
        return {
          pill: 'bg-neutral-950/90 text-white border-white/20 hover:border-white/40 shadow-black/40',
          dot: 'bg-amber-400 shadow-amber-400/50',
          icon: 'text-amber-400',
          accentText: 'text-amber-400',
        };
    }
  };

  const st = getThemeStyles();

  return (
    <aside
      aria-label="Direct studio inquiry button"
      className="fixed bottom-5 sm:bottom-7 left-4 sm:left-8 z-35 pointer-events-auto"
    >
      <motion.button
        type="button"
        onClick={onOpenContact}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={`group relative flex items-center gap-2.5 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-full border backdrop-blur-xl shadow-2xl cursor-pointer transition-all select-none ${st.pill}`}
        title={`Directly message or book ${studioName}`}
      >
        {/* Pulsing live connection dot */}
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${st.dot}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 shadow-xs ${st.dot}`} />
        </span>

        {/* Message / Sparkle Icon */}
        <Mail className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:scale-110 ${st.icon}`} />

        {/* Label */}
        <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide">
          <span>Inquire & Book</span>
          <Sparkles className="w-3 h-3 opacity-60 hidden sm:inline" />
        </div>
      </motion.button>
    </aside>
  );
};
