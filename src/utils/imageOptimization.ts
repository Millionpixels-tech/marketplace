/**
 * Image SEO Utilities for Sina.lk
 * Provides functions for optimizing images for SEO and performance
 */

export interface ImageSEOData {
  alt: string;
  title?: string;
  src: string;
  srcSet?: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  width?: number;
  height?: number;
}

export interface ProductImageSEO extends ImageSEOData {
  productName: string;
  shopName?: string;
  category?: string;
}

/**
 * Generates SEO-optimized alt text for product images
 */
export function generateProductImageAlt(
  productName: string,
  shopName?: string,
  category?: string,
  imageIndex?: number
): string {
  let alt = productName.trim();
  
  // Add descriptive context
  if (category) {
    alt += ` - ${category}`;
  }
  
  if (shopName) {
    alt += ` by ${shopName}`;
  }
  
  // Add image number for multiple images
  if (imageIndex !== undefined && imageIndex > 0) {
    alt += ` (Image ${imageIndex + 1})`;
  }
  
  // Add location context for marketplace
  alt += ' - Sri Lankan marketplace';
  
  return alt;
}

/**
 * Generates SEO-optimized alt text for shop/profile images
 */
export function generateShopImageAlt(shopName: string, type: 'logo' | 'banner' | 'profile'): string {
  const typeText = {
    logo: 'logo',
    banner: 'banner image',
    profile: 'profile picture'
  };
  
  return `${shopName} ${typeText[type]} - Sri Lankan artisan shop on Sina.lk`;
}

/**
 * Generates responsive srcSet for images
 */
export function generateImageSrcSet(baseUrl: string, sizes: number[] = [400, 600, 800, 1200]): string {
  return sizes
    .map(size => {
      // Assuming you have image resizing service or different size versions
      const resizedUrl = baseUrl.includes('?') 
        ? `${baseUrl}&w=${size}`
        : `${baseUrl}?w=${size}`;
      return `${resizedUrl} ${size}w`;
    })
    .join(', ');
}

/**
 * Generates sizes attribute for responsive images
 */
export function generateImageSizes(
  breakpoints: Array<{ maxWidth: string; imageWidth: string }> = [
    { maxWidth: '768px', imageWidth: '100vw' },
    { maxWidth: '1024px', imageWidth: '50vw' },
    { maxWidth: '1200px', imageWidth: '33vw' },
  ]
): string {
  const sizeQueries = breakpoints.map(bp => `(max-width: ${bp.maxWidth}) ${bp.imageWidth}`);
  sizeQueries.push('25vw'); // default size
  return sizeQueries.join(', ');
}

/**
 * Creates optimized image props for product images
 */
export function createProductImageProps(
  src: string,
  productName: string,
  options: {
    shopName?: string;
    category?: string;
    imageIndex?: number;
    loading?: 'lazy' | 'eager';
    width?: number;
    height?: number;
    generateSrcSet?: boolean;
  } = {}
): ImageSEOData {
  const alt = generateProductImageAlt(
    productName,
    options.shopName,
    options.category,
    options.imageIndex
  );
  
  const imageProps: ImageSEOData = {
    src,
    alt,
    title: `${productName} - Available on Sina.lk`,
    loading: options.loading || (options.imageIndex === 0 ? 'eager' : 'lazy'),
  };
  
  if (options.width) imageProps.width = options.width;
  if (options.height) imageProps.height = options.height;
  
  if (options.generateSrcSet) {
    imageProps.srcSet = generateImageSrcSet(src);
    imageProps.sizes = generateImageSizes();
  }
  
  return imageProps;
}

/**
 * Creates optimized image props for shop images
 */
export function createShopImageProps(
  src: string,
  shopName: string,
  type: 'logo' | 'banner' | 'profile',
  options: {
    loading?: 'lazy' | 'eager';
    width?: number;
    height?: number;
    generateSrcSet?: boolean;
  } = {}
): ImageSEOData {
  const alt = generateShopImageAlt(shopName, type);
  
  const imageProps: ImageSEOData = {
    src,
    alt,
    title: `${shopName} - Sri Lankan artisan shop`,
    loading: options.loading || 'lazy',
  };
  
  if (options.width) imageProps.width = options.width;
  if (options.height) imageProps.height = options.height;
  
  if (options.generateSrcSet) {
    imageProps.srcSet = generateImageSrcSet(src);
    imageProps.sizes = type === 'banner' ? '100vw' : generateImageSizes();
  }
  
  return imageProps;
}

/**
 * Validates image for SEO best practices
 */
export function validateImageSEO(imageData: ImageSEOData): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Check alt text
  if (!imageData.alt) {
    errors.push('Alt text is required for accessibility and SEO');
  } else {
    if (imageData.alt.length < 5) {
      warnings.push('Alt text is very short - consider adding more descriptive text');
    }
    if (imageData.alt.length > 125) {
      warnings.push('Alt text is quite long - consider shortening for better accessibility');
    }
    if (imageData.alt.toLowerCase().startsWith('image of')) {
      warnings.push('Avoid starting alt text with "image of" - screen readers already announce it as an image');
    }
  }
  
  // Check file format based on URL
  const url = imageData.src.toLowerCase();
  if (!url.includes('.webp') && !url.includes('.avif')) {
    warnings.push('Consider using modern image formats like WebP or AVIF for better performance');
  }
  
  // Check dimensions
  if (!imageData.width || !imageData.height) {
    warnings.push('Specify width and height to prevent layout shift');
  }
  
  // Check loading strategy
  if (!imageData.loading) {
    warnings.push('Specify loading attribute for performance optimization');
  }
  
  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Generates structured data for images (ImageObject)
 */
export function generateImageStructuredData(
  imageUrl: string,
  alt: string,
  caption?: string,
  width?: number,
  height?: number
): object {
  const imageData: any = {
    '@type': 'ImageObject',
    url: imageUrl,
    description: alt,
  };
  
  if (caption) imageData.caption = caption;
  if (width) imageData.width = width;
  if (height) imageData.height = height;
  
  return imageData;
}

/**
 * Creates a React img element with optimized SEO props
 */
export function createSEOImage(
  src: string,
  alt: string,
  options: {
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
    loading?: 'lazy' | 'eager';
    width?: number;
    height?: number;
    generateSrcSet?: boolean;
  } = {}
): React.ImgHTMLAttributes<HTMLImageElement> {
  const imageProps: React.ImgHTMLAttributes<HTMLImageElement> = {
    src,
    alt,
    loading: options.loading || 'lazy',
    className: options.className,
    style: options.style,
    onClick: options.onClick,
  };
  
  if (options.width) imageProps.width = options.width;
  if (options.height) imageProps.height = options.height;
  
  if (options.generateSrcSet) {
    imageProps.srcSet = generateImageSrcSet(src);
    imageProps.sizes = generateImageSizes();
  }
  
  return imageProps;
}

// Common image dimensions for different use cases
export const IMAGE_DIMENSIONS = {
  PRODUCT_THUMBNAIL: { width: 200, height: 200 },
  PRODUCT_MAIN: { width: 600, height: 600 },
  PRODUCT_GALLERY: { width: 800, height: 800 },
  SHOP_LOGO: { width: 100, height: 100 },
  SHOP_BANNER: { width: 1200, height: 300 },
  PROFILE_AVATAR: { width: 80, height: 80 },
} as const;
