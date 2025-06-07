import { useState, useRef, useEffect } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
}

/**
 * Lazy loading image component to improve performance
 */
export const LazyImage: React.FC<LazyImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  style,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Crect width="40" height="40" fill="%23f3f4f6"/%3E%3C/svg%3E'
}) => {
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <img
      ref={imgRef}
      src={isInView ? src : placeholder}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
    />
  );
};

/**
 * Custom hook for image preloading
 */
export const useImagePreloader = (imageSources: string[]) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const preloadImage = (src: string) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          setLoadedImages(prev => new Set(prev).add(src));
          resolve();
        };
        img.onerror = () => resolve(); // Still resolve on error to avoid hanging
        img.src = src;
      });
    };

    // Preload images in batches to avoid overwhelming the browser
    const batchSize = 5;
    let index = 0;

    const loadBatch = async () => {
      const batch = imageSources.slice(index, index + batchSize);
      if (batch.length === 0) return;

      await Promise.all(batch.map(preloadImage));
      index += batchSize;

      if (index < imageSources.length) {
        // Small delay between batches
        setTimeout(loadBatch, 100);
      }
    };

    loadBatch();
  }, [imageSources]);

  return loadedImages;
};
