/**
 * Image utility functions for compression and SEO optimization
 */

/**
 * Compresses an image file to reduce its size
 * @param file - The original image file
 * @param maxWidth - Maximum width for the compressed image (default: 1200)
 * @param maxHeight - Maximum height for the compressed image (default: 1200)
 * @param quality - Compression quality 0-1 (default: 0.8)
 * @returns Promise<File> - The compressed image file
 */
export const compressImage = async (
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress the image
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Canvas toBlob failed'));
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => reject(new Error('Image load failed'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Creates multiple compressed versions of an image for different use cases
 * @param file - The original image file
 * @returns Promise with thumbnail, medium, and large versions
 */
export const createImageVariants = async (file: File) => {
  const [thumbnail, medium, large] = await Promise.all([
    compressImage(file, 300, 300, 0.7), // Thumbnail: 300x300, 70% quality
    compressImage(file, 600, 600, 0.8), // Medium: 600x600, 80% quality
    compressImage(file, 1200, 1200, 0.85), // Large: 1200x1200, 85% quality
  ]);

  return { thumbnail, medium, large };
};

/**
 * Generates SEO-friendly filename based on product details
 * @param productName - Name of the product
 * @param category - Product category
 * @param subcategory - Product subcategory (optional)
 * @param index - Image index for multiple images
 * @param shopName - Shop name (optional)
 * @returns SEO-optimized filename
 */
export const generateSEOFilename = (
  productName: string,
  category: string,
  subcategory?: string,
  index: number = 0,
  shopName?: string
): string => {
  // Clean and format strings for SEO
  const cleanString = (str: string): string => {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  const cleanProductName = cleanString(productName);
  const cleanCategory = cleanString(category);
  const cleanSubcategory = subcategory ? cleanString(subcategory) : '';
  const cleanShopName = shopName ? cleanString(shopName) : '';

  // Build SEO filename parts
  const parts: string[] = [];
  
  if (cleanProductName) parts.push(cleanProductName);
  if (cleanCategory) parts.push(cleanCategory);
  if (cleanSubcategory) parts.push(cleanSubcategory);
  if (cleanShopName) parts.push(cleanShopName);
  
  // Add descriptive terms for better SEO
  parts.push('sri-lanka');
  parts.push('marketplace');
  
  // Add image index if multiple images
  if (index > 0) {
    parts.push(`img-${index + 1}`);
  }

  return parts.join('-');
};

/**
 * Generates alt text for images based on product details
 * @param productName - Name of the product
 * @param category - Product category
 * @param subcategory - Product subcategory (optional)
 * @param index - Image index for multiple images
 * @param shopName - Shop name (optional)
 * @returns SEO-optimized alt text
 */
export const generateImageAltText = (
  productName: string,
  category: string,
  subcategory?: string,
  index: number = 0,
  shopName?: string
): string => {
  const parts: string[] = [];
  
  if (productName) parts.push(productName);
  if (subcategory) parts.push(`in ${subcategory}`);
  if (category) parts.push(`${category} category`);
  if (shopName) parts.push(`from ${shopName}`);
  
  parts.push('- Authentic Sri Lankan product');
  
  if (index > 0) {
    parts.push(`(Image ${index + 1})`);
  }

  return parts.join(' ');
};

/**
 * Validates image file before processing
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in MB (default: 10)
 * @returns boolean - true if valid
 */
export const validateImageFile = (file: File, maxSizeMB: number = 10): boolean => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload JPEG, PNG, or WebP images.');
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error(`File size too large. Maximum size is ${maxSizeMB}MB.`);
  }

  return true;
};

/**
 * Process image for upload with compression and SEO optimization
 * @param file - Original image file
 * @param productName - Name of the product
 * @param category - Product category
 * @param subcategory - Product subcategory (optional)
 * @param index - Image index for multiple images
 * @param shopName - Shop name (optional)
 * @returns Processed image file with SEO filename
 */
export const processImageForUpload = async (
  file: File,
  productName: string,
  category: string,
  subcategory?: string,
  index: number = 0,
  shopName?: string
): Promise<File> => {
  // Validate the file first
  validateImageFile(file);

  // Compress the image
  const compressedFile = await compressImage(file);

  // Generate SEO filename
  const seoFilename = generateSEOFilename(
    productName,
    category,
    subcategory,
    index,
    shopName
  );

  // Get file extension
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';

  // Create new file with SEO filename
  const processedFile = new File([compressedFile], `${seoFilename}.${extension}`, {
    type: compressedFile.type,
    lastModified: Date.now(),
  });

  return processedFile;
};
