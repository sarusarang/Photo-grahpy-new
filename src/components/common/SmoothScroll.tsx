import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

interface SmoothScrollContextType {
  lenis: Lenis | null;
  resize: () => void;
  scrollTo: (target: number | HTMLElement | string, options?: any) => void;
}

const SmoothScrollContext = createContext<SmoothScrollContextType>({
  lenis: null,
  resize: () => {},
  scrollTo: () => {},
});

export const useSmoothScroll = () => useContext(SmoothScrollContext);

/**
 * Hook to listen to scroll updates with Lenis
 * Efficiently triggers state changes only in the subscribing component
 */
export const useLenisScroll = (callback: (scroll: number, direction: number) => void) => {
  const { lenis } = useSmoothScroll();
  const cbRef = useRef(callback);

  useEffect(() => {
    cbRef.current = callback;
  });

  useEffect(() => {
    if (!lenis) {
      // Fallback to window scroll if Lenis is not available
      const handleWindowScroll = () => {
        cbRef.current(window.scrollY, 0);
      };
      window.addEventListener('scroll', handleWindowScroll, { passive: true });
      handleWindowScroll();
      return () => window.removeEventListener('scroll', handleWindowScroll);
    }

    const handler = (e: { scroll: number; direction: number }) => {
      cbRef.current(e.scroll, e.direction);
    };

    lenis.on('scroll', handler);
    // Initial call
    cbRef.current(lenis.scroll, 0);

    return () => {
      lenis.off('scroll', handler);
    };
  }, [lenis]);
};

export interface SmoothScrollProviderProps {
  children: React.ReactNode;
  wrapperRef?: React.RefObject<any>;
  contentRef?: React.RefObject<any>;
  resetOnKey?: any;
  duration?: number;
  wheelMultiplier?: number;
}

export const SmoothScrollProvider: React.FC<SmoothScrollProviderProps> = ({
  children,
  wrapperRef,
  contentRef,
  resetOnKey,
  duration = 1.15,
  wheelMultiplier = 1,
}) => {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef?.current || window;
    const content =
      contentRef?.current ||
      (wrapper instanceof HTMLElement ? (wrapper.firstElementChild as HTMLElement) : undefined);

    const instance = new Lenis({
      wrapper,
      content,
      duration,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier,
      touchMultiplier: 1.5,
      autoResize: true,
    });

    setLenis(instance);

    let rafId: number;
    const raf = (time: number) => {
      instance.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      instance.destroy();
      setLenis(null);
    };
  }, [wrapperRef, contentRef, duration, wheelMultiplier]);

  // Reset scroll on key change (e.g., location.pathname or tab navigation)
  useEffect(() => {
    if (resetOnKey !== undefined && lenis) {
      lenis.scrollTo(0, { immediate: true });
    }
  }, [resetOnKey, lenis]);

  const resize = () => {
    lenis?.resize();
  };

  const scrollTo = (target: number | HTMLElement | string, options?: any) => {
    lenis?.scrollTo(target, options);
  };

  return (
    <SmoothScrollContext.Provider value={{ lenis, resize, scrollTo }}>
      {children}
    </SmoothScrollContext.Provider>
  );
};
