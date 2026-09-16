import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

interface SmoothScrollContextType {
  lenis: Lenis | null;
}

const SmoothScrollContext = createContext<SmoothScrollContextType>({
  lenis: null,
});

export const useSmoothScroll = () => useContext(SmoothScrollContext);

/**
 * Hook to listen to scroll updates with Lenis
 * Efficiently triggers state changes only in the subscribing component
 */
export const useLenisScroll = (callback: (scroll: number, direction: number) => void) => {
  const { lenis } = useSmoothScroll();
  const cbRef = useRef(callback);
  cbRef.current = callback;

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

    const handler = (e: any) => {
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

interface SmoothScrollProviderProps {
  children: React.ReactNode;
}

export const SmoothScrollProvider: React.FC<SmoothScrollProviderProps> = ({ children }) => {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    const instance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
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
  }, []);

  return (
    <SmoothScrollContext.Provider value={{ lenis }}>
      {children}
    </SmoothScrollContext.Provider>
  );
};
