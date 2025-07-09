/**
 * Core Web Vitals Optimization Utilities
 * Essential for top search rankings - Google's ranking factor
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

interface LCPEntry extends PerformanceEntry {
  startTime: number;
}

interface FIDEntry extends PerformanceEntry {
  processingStart: number;
  startTime: number;
}

interface CLSEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface WebVitalsMetrics {
  lcp: number;
  fid: number;
  cls: number;
  timestamp: number;
}

// Performance monitoring utilities
export const performanceMonitor = {
  // Measure Largest Contentful Paint (LCP)
  measureLCP: (): Promise<number> => {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries() as LCPEntry[];
        const lastEntry = entries[entries.length - 1];
        resolve(lastEntry.startTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });
    });
  },

  // Measure First Input Delay (FID)
  measureFID: (): Promise<number> => {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as FIDEntry[]) {
          resolve(entry.processingStart - entry.startTime);
        }
      }).observe({ entryTypes: ['first-input'] });
    });
  },

  // Measure Cumulative Layout Shift (CLS)
  measureCLS: (): Promise<number> => {
    return new Promise((resolve) => {
      let clsValue = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as CLSEntry[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        resolve(clsValue);
      }).observe({ entryTypes: ['layout-shift'] });
    });
  },

  // Report all metrics
  reportMetrics: async (): Promise<WebVitalsMetrics> => {
    const metrics: WebVitalsMetrics = {
      lcp: await performanceMonitor.measureLCP(),
      fid: await performanceMonitor.measureFID(),
      cls: await performanceMonitor.measureCLS(),
      timestamp: Date.now()
    };
    
    // Send to analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'web_vitals', {
        metric_name: 'lcp',
        metric_value: Math.round(metrics.lcp),
        metric_id: 'lcp'
      });
      
      window.gtag('event', 'web_vitals', {
        metric_name: 'fid',
        metric_value: Math.round(metrics.fid),
        metric_id: 'fid'
      });
      
      window.gtag('event', 'web_vitals', {
        metric_name: 'cls',
        metric_value: Math.round(metrics.cls * 1000) / 1000,
        metric_id: 'cls'
      });
    }
    
    return metrics;
  }
};

// Image optimization utilities
export const imageOptimization = {
  // Generate responsive image sources
  generateSrcSet: (baseUrl: string, sizes: number[] = [320, 640, 768, 1024, 1280, 1920]) => {
    return sizes.map(size => `${baseUrl}?w=${size} ${size}w`).join(', ');
  },

  // Generate sizes attribute
  generateSizes: (breakpoints: Array<{ mediaQuery: string; size: string }> = [
    { mediaQuery: '(max-width: 320px)', size: '280px' },
    { mediaQuery: '(max-width: 640px)', size: '600px' },
    { mediaQuery: '(max-width: 768px)', size: '728px' },
    { mediaQuery: '(max-width: 1024px)', size: '984px' },
    { mediaQuery: '(max-width: 1280px)', size: '1240px' }
  ]) => {
    const sizesArray = breakpoints.map(bp => `${bp.mediaQuery} ${bp.size}`);
    sizesArray.push('100vw'); // Default size
    return sizesArray.join(', ');
  },

  // Preload critical images
  preloadImage: (src: string, as: string = 'image') => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = as;
    link.href = src;
    document.head.appendChild(link);
  },

  // Lazy load images with intersection observer
  setupLazyLoading: () => {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.classList.remove('lazy');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }
};

// Critical resource optimization
export const criticalResourceOptimization = {
  // Preload critical resources
  preloadCriticalResources: () => {
    const criticalResources = [
      { href: '/fonts/main.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' },
      { href: '/css/critical.css', as: 'style' },
      { href: '/js/critical.js', as: 'script' }
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      if (resource.type) link.type = resource.type;
      if (resource.crossorigin) link.crossOrigin = resource.crossorigin;
      document.head.appendChild(link);
    });
  },

  // Remove unused CSS
  removeUnusedCSS: () => {
    // This would typically be handled by build tools like PurgeCSS
    // But we can implement runtime optimization
    const usedSelectors = new Set();
    document.querySelectorAll('*').forEach(element => {
      usedSelectors.add(element.tagName.toLowerCase());
      if (element.className) {
        element.className.split(' ').forEach(cls => {
          if (cls) usedSelectors.add(`.${cls}`);
        });
      }
      if (element.id) {
        usedSelectors.add(`#${element.id}`);
      }
    });
    
    return Array.from(usedSelectors);
  },

  // Optimize loading sequence
  optimizeLoadingSequence: () => {
    // Critical CSS inline
    const criticalCSS = `
      /* Critical above-the-fold styles */
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; }
      .header { position: sticky; top: 0; background: #fff; z-index: 100; }
      .hero { min-height: 400px; display: flex; align-items: center; }
      .loading { display: flex; justify-content: center; align-items: center; min-height: 200px; }
    `;
    
    const style = document.createElement('style');
    style.textContent = criticalCSS;
    document.head.appendChild(style);

    // Load non-critical CSS asynchronously
    const loadCSS = (href: string) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = 'style';
      link.onload = () => {
        link.rel = 'stylesheet';
      };
      document.head.appendChild(link);
    };

    // Load non-critical stylesheets
    ['tailwind.css', 'components.css'].forEach(loadCSS);
  }
};

// Performance budgets and monitoring
export const performanceBudget = {
  // Set performance budgets
  budgets: {
    lcp: 2500, // milliseconds
    fid: 100,  // milliseconds
    cls: 0.1,  // score
    ttfb: 600, // milliseconds
    fcp: 1800  // milliseconds
  },

  // Check if metrics meet budgets
  checkBudgets: async (): Promise<{lcp: boolean, fid: boolean, cls: boolean, overall: boolean}> => {
    const metrics = await performanceMonitor.reportMetrics();
    const results = {
      lcp: metrics.lcp <= performanceBudget.budgets.lcp,
      fid: metrics.fid <= performanceBudget.budgets.fid,
      cls: metrics.cls <= performanceBudget.budgets.cls,
      overall: true
    };

    results.overall = Object.values(results).every(Boolean);
    
    // Log results
    console.group('Performance Budget Check');
    console.log('LCP:', metrics.lcp, 'ms', results.lcp ? '✅' : '❌');
    console.log('FID:', metrics.fid, 'ms', results.fid ? '✅' : '❌');
    console.log('CLS:', metrics.cls, results.cls ? '✅' : '❌');
    console.log('Overall:', results.overall ? '✅ PASS' : '❌ FAIL');
    console.groupEnd();

    return results;
  },

  // Performance recommendations
  getRecommendations: (metrics: WebVitalsMetrics) => {
    const recommendations = [];

    if (metrics.lcp > performanceBudget.budgets.lcp) {
      recommendations.push({
        metric: 'LCP',
        issue: 'Largest Contentful Paint is too slow',
        solutions: [
          'Optimize images with WebP format',
          'Implement critical CSS inlining',
          'Use CDN for static assets',
          'Preload key resources',
          'Optimize server response time'
        ]
      });
    }

    if (metrics.fid > performanceBudget.budgets.fid) {
      recommendations.push({
        metric: 'FID',
        issue: 'First Input Delay is too high',
        solutions: [
          'Reduce JavaScript execution time',
          'Code splitting for large bundles',
          'Use web workers for heavy computations',
          'Defer non-critical JavaScript',
          'Optimize third-party scripts'
        ]
      });
    }

    if (metrics.cls > performanceBudget.budgets.cls) {
      recommendations.push({
        metric: 'CLS',
        issue: 'Cumulative Layout Shift is too high',
        solutions: [
          'Set dimensions for images and videos',
          'Reserve space for ads and embeds',
          'Use font-display: swap for web fonts',
          'Avoid inserting content above existing content',
          'Use transform animations instead of layout changes'
        ]
      });
    }

    return recommendations;
  }
};

// Initialize performance optimization
export const initializePerformanceOptimization = () => {
  // Setup critical resource optimization
  criticalResourceOptimization.preloadCriticalResources();
  criticalResourceOptimization.optimizeLoadingSequence();

  // Setup image lazy loading
  imageOptimization.setupLazyLoading();

  // Monitor performance after page load
  window.addEventListener('load', async () => {
    setTimeout(async () => {
      const budgetCheck = await performanceBudget.checkBudgets();
      if (!budgetCheck.overall) {
        const metrics = await performanceMonitor.reportMetrics();
        const recommendations = performanceBudget.getRecommendations(metrics);
        console.warn('Performance budget exceeded:', recommendations);
      }
    }, 1000);
  });

  // Report to analytics
  window.addEventListener('load', () => {
    setTimeout(() => {
      performanceMonitor.reportMetrics();
    }, 0);
  });
};

export default {
  performanceMonitor,
  imageOptimization,
  criticalResourceOptimization,
  performanceBudget,
  initializePerformanceOptimization
};
