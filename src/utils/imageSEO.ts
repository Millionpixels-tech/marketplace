// Image optimization and SEO utilities

export interface ImageSEOProps {
  src: string;
  alt: string;
  title?: string;
  loading?: 'lazy' | 'eager';
  width?: number;
  height?: number;
  className?: string;
}

// Generate descriptive alt text for products
export const generateProductAlt = (productName: string, category?: string) => {
  if (category) {
    return `${productName} - Authentic Sri Lankan ${category}`;
  }
  return `${productName} - Authentic Sri Lankan Product`;
};

// Generate alt text for shop logos
export const generateShopLogoAlt = (shopName: string) => {
  return `${shopName} - Sri Lankan Artisan Shop Logo`;
};

// Generate alt text for category images
export const generateCategoryAlt = (categoryName: string) => {
  return `${categoryName} - Sri Lankan ${categoryName} Products and Crafts`;
};

// WebP format support checker
export const supportsWebP = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').startsWith('data:image/webp');
};

// Generate responsive image srcSet
export const generateSrcSet = (baseUrl: string, sizes: number[] = [300, 600, 1200]) => {
  return sizes.map(size => `${baseUrl}?w=${size} ${size}w`).join(', ');
};

// Image optimization recommendations
export const IMAGE_SEO_GUIDELINES = {
  formats: {
    preferred: ['WebP', 'AVIF'],
    fallback: ['JPEG', 'PNG']
  },
  sizing: {
    thumbnail: { width: 300, height: 300 },
    card: { width: 400, height: 300 },
    hero: { width: 1200, height: 600 },
    gallery: { width: 800, height: 600 }
  },
  compression: {
    quality: 85,
    progressive: true
  },
  altText: {
    maxLength: 125,
    shouldInclude: ['product name', 'key features', 'context'],
    shouldAvoid: ['redundant words', 'image of', 'picture of']
  }
};

// Generate structured data for images
export const getImageStructuredData = (image: {
  url: string;
  caption?: string;
  width?: number;
  height?: number;
  creator?: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'ImageObject',
  url: image.url,
  caption: image.caption,
  width: image.width,
  height: image.height,
  creator: image.creator ? {
    '@type': 'Person',
    name: image.creator
  } : undefined
});

// Check if image meets SEO best practices
export const validateImageSEO = (image: ImageSEOProps) => {
  const issues: string[] = [];
  
  if (!image.alt || image.alt.trim().length === 0) {
    issues.push('Missing alt text');
  } else if (image.alt.length > 125) {
    issues.push('Alt text too long (>125 characters)');
  }
  
  if (image.alt && (
    image.alt.toLowerCase().includes('image of') ||
    image.alt.toLowerCase().includes('picture of')
  )) {
    issues.push('Alt text contains redundant phrases');
  }
  
  if (!image.width || !image.height) {
    issues.push('Missing width/height attributes (affects CLS)');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};
