import { useEffect } from 'react';
import { useSmoothScroll } from '../components/common/SmoothScroll';

/**
 * Custom hook to lock body scrolling and disable Lenis smooth scrolling when a modal is open.
 * Prevents background page scrolling while allowing scrolling inside modal dialogs.
 */
export const useScrollLock = (isLocked: boolean) => {
  const { lenis } = useSmoothScroll();

  useEffect(() => {
    if (!isLocked) return;

    // Pause Lenis smooth scrolling so wheel events inside modal don't scroll page behind
    lenis?.stop();

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Compensate for scrollbar removal to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      lenis?.start();
    };
  }, [isLocked, lenis]);
};
