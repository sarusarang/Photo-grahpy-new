import React from 'react';

interface SocialShareButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  accentBg: string;
  accentText: string;
  hoverBg: string;
  hoverBorder: string;
}

export const SocialShareButton: React.FC<SocialShareButtonProps> = ({
  label,
  icon,
  onClick,
  accentBg,
  accentText,
  hoverBg,
  hoverBorder,
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 p-2.5 rounded-xl bg-neutral-900/90 ${hoverBg} border border-neutral-800 ${hoverBorder} transition-all group cursor-pointer text-neutral-200 hover:text-white active:scale-95`}
    >
      <div
        className={`w-7 h-7 rounded-lg ${accentBg} flex items-center justify-center ${accentText} group-hover:scale-110 transition-transform shrink-0`}
      >
        {icon}
      </div>
      <span className="text-xs font-medium truncate">{label}</span>
    </button>
  );
};
