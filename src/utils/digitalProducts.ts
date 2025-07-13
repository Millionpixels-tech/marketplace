// Digital product utility functions
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

// Constants for digital products
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
export const ALLOWED_FILE_TYPES = [
  'pdf', 'doc', 'docx', 'txt', 'rtf',  // Documents
  'zip', 'rar', '7z',                  // Archives
  'mp3', 'wav', 'flac', 'm4a',        // Audio
  'mp4', 'avi', 'mov', 'mkv',         // Video
  'jpg', 'jpeg', 'png', 'gif', 'svg', // Images
  'psd', 'ai', 'sketch',              // Design files
  'epub', 'mobi',                     // Ebooks
  'exe', 'dmg', 'apk'                 // Software
];

export interface DigitalProductData {
  type: 'file' | 'link';
  fileUrl?: string;
  downloadLink?: string;
  fileName?: string;
  fileSize?: number;
  uploadedAt?: Date;
}

/**
 * Upload digital product file to Firebase Storage
 * @param file - The digital product file
 * @param listingId - The listing ID for organizing storage
 * @param shopId - The shop ID
 * @returns Promise<DigitalProductData>
 */
export const uploadDigitalProductFile = async (
  file: File,
  listingId: string,
  shopId: string
): Promise<DigitalProductData> => {
  if (!file) {
    throw new Error('No file provided');
  }

  // Check file size (50MB limit)
  const maxSizeBytes = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSizeBytes) {
    throw new Error('File size exceeds 50MB limit. Please use a download link instead.');
  }

  try {
    // Create organized storage path
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const timestamp = now.getTime();
    const storagePath = `digital-products/${shopId}/${year}/${month}/${listingId}/${timestamp}_${file.name}`;
    
    const storageRef = ref(storage, storagePath);
    
    // Upload with metadata
    const uploadResult = await uploadBytes(storageRef, file, {
      customMetadata: {
        listingId,
        shopId,
        originalFileName: file.name,
        fileSize: file.size.toString(),
        fileType: file.type,
        uploadedAt: now.toISOString(),
        contentType: 'digital-product'
      }
    });
    
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    return {
      type: 'file',
      fileUrl: downloadURL,
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: now
    };
  } catch (error) {
    console.error('Error uploading digital product file:', error);
    throw new Error('Failed to upload digital product file. Please try again.');
  }
};

/**
 * Validate digital product download link
 * @param link - The download link to validate
 * @returns boolean
 */
export const validateDownloadLink = (link: string): boolean => {
  if (!link.trim()) {
    return false;
  }

  try {
    const url = new URL(link);
    // Check if it's a valid HTTP/HTTPS URL
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Create digital product data from download link
 * @param link - The download link
 * @returns DigitalProductData
 */
export const createDigitalProductFromLink = (link: string): DigitalProductData => {
  if (!validateDownloadLink(link)) {
    throw new Error('Invalid download link. Please provide a valid HTTP/HTTPS URL.');
  }

  return {
    type: 'link',
    downloadLink: link.trim(),
    uploadedAt: new Date()
  };
};

/**
 * Format file size for display
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get file extension from filename
 * @param filename - The filename
 * @returns File extension
 */
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

/**
 * Check if file type is allowed for digital products
 * @param file - The file to check
 * @returns boolean
 */
export const isAllowedDigitalFileType = (file: File): boolean => {
  const allowedTypes = [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/svg+xml',
    'image/webp',
    
    // Audio
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/m4a',
    
    // Video
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/wmv',
    
    // Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    
    // Software
    'application/x-executable',
    'application/x-msdownload',
    'application/x-apple-diskimage',
    
    // Other common digital product types
    'application/json',
    'text/css',
    'text/html',
    'text/javascript',
    'application/javascript'
  ];
  
  return allowedTypes.includes(file.type);
};
