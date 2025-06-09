import { useState, useEffect } from 'react';

type BreakpointKeys = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const breakpoints: Record<BreakpointKeys, number> = {
  xs: 0,     // 0px and up
  sm: 640,   // 640px and up
  md: 768,   // 768px and up
  lg: 1024,  // 1024px and up
  xl: 1280,  // 1280px and up
  '2xl': 1536, // 1536px and up
};

/**
 * Hook to detect current screen size and provide responsive utilities
 */
export const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { width } = windowSize;

  const isMobile = width < breakpoints.md; // < 768px
  const isTablet = width >= breakpoints.md && width < breakpoints.lg; // 768px - 1023px
  const isDesktop = width >= breakpoints.lg; // >= 1024px

  const isXs = width < breakpoints.sm; // < 640px
  const isSm = width >= breakpoints.sm && width < breakpoints.md; // 640px - 767px
  const isMd = width >= breakpoints.md && width < breakpoints.lg; // 768px - 1023px
  const isLg = width >= breakpoints.lg && width < breakpoints.xl; // 1024px - 1279px
  const isXl = width >= breakpoints.xl && width < breakpoints['2xl']; // 1280px - 1535px
  const is2xl = width >= breakpoints['2xl']; // >= 1536px

  const breakpoint: BreakpointKeys = (() => {
    if (is2xl) return '2xl';
    if (isXl) return 'xl';
    if (isLg) return 'lg';
    if (isMd) return 'md';
    if (isSm) return 'sm';
    return 'xs';
  })();

  return {
    windowSize,
    isMobile,
    isTablet,
    isDesktop,
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    is2xl,
    breakpoint,
    width,
    height: windowSize.height,
  };
};

/**
 * Utility function to get responsive class names
 */
export const getResponsiveClasses = (
  mobile: string,
  tablet?: string,
  desktop?: string
) => {
  const tabletClass = tablet || desktop || '';
  const desktopClass = desktop || '';
  
  return `${mobile} ${tabletClass ? `md:${tabletClass}` : ''} ${desktopClass ? `lg:${desktopClass}` : ''}`.trim();
};

/**
 * Utility function to get responsive values
 */
export const useResponsiveValue = <T>(
  mobile: T,
  tablet?: T,
  desktop?: T
) => {
  const { isTablet, isDesktop } = useResponsive();
  
  if (isDesktop && desktop !== undefined) return desktop;
  if (isTablet && tablet !== undefined) return tablet;
  return mobile;
};
