import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'auto' | 'light' | 'dark';
  alt?: string;
}

/**
 * EX SHARE Brand Logo Component
 * - variant="light": Always displays the black logo (for light backgrounds)
 * - variant="dark": Always displays the white logo (for dark backgrounds)
 * - variant="auto": Adapts dynamically to light (black logo) and dark (white logo) modes
 */
export const Logo: React.FC<LogoProps> = ({
  className = 'h-7 w-auto object-contain',
  variant = 'auto',
  alt = 'EX SHARE',
}) => {
  if (variant === 'light') {
    return (
      <img
        src="/ex-share-balck-logo.png"
        alt={alt}
        className={className}
      />
    );
  }

  if (variant === 'dark') {
    return (
      <img
        src="/ex-share-white-logo.png"
        alt={alt}
        className={className}
      />
    );
  }

  return (
    <>
      <img
        src="/ex-share-balck-logo.png"
        alt={alt}
        className={`dark:hidden ${className}`}
      />
      <img
        src="/ex-share-white-logo.png"
        alt={alt}
        className={`hidden dark:block ${className}`}
      />
    </>
  );
};
