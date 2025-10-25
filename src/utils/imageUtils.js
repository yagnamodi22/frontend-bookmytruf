// Image utility functions for handling image URLs

// Base URL for API requests
const API_BASE_URL = 'http://localhost:8080';

/**
 * Formats image URLs to ensure they are properly displayed
 * Handles different image formats:
 * - Base64 encoded images (data:image/...)
 * - Relative paths (/uploads/...)
 * - Full URLs (http://...)
 * - Comma-separated image paths
 * 
 * @param {string} imagePath - The image path or data
 * @param {string} defaultImage - Default image to use if path is invalid
 * @returns {string} Properly formatted image URL
 */
export const getImageSrc = (imagePath, defaultImage = '/default-image.jpg') => {
  if (!imagePath || imagePath === 'null' || imagePath === 'undefined' || imagePath.trim() === '') {
    return defaultImage;
  }
  
  // If it's already a base64 image or full URL, use it directly
  if (imagePath.startsWith('data:image') || imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // If it's a relative path from the backend, prepend the API base URL
  if (imagePath.startsWith('/uploads/')) {
    return `${API_BASE_URL}${imagePath}`;
  }
  
  // For paths without leading slash, ensure proper formatting
  if (imagePath.startsWith('uploads/')) {
    return `${API_BASE_URL}/${imagePath}`;
  }
  
  // Handle file names directly
  return `${API_BASE_URL}/uploads/${imagePath}`;
};

/**
 * Handles multiple image paths, typically comma-separated from backend
 * 
 * @param {string} imagePaths - Comma-separated image paths or single path
 * @param {string} defaultImage - Default image to use if paths are invalid
 * @returns {Array} Array of properly formatted image URLs
 */
export const getImageSources = (imagePaths, defaultImage = '/default-image.jpg') => {
  if (!imagePaths || imagePaths === 'null' || imagePaths === 'undefined') return [defaultImage];
  
  // If it's already a base64 image, return it as a single-item array
  if (typeof imagePaths === 'string' && imagePaths.startsWith('data:image')) {
    return [imagePaths];
  }
  
  // Handle array input
  if (Array.isArray(imagePaths)) {
    if (imagePaths.length === 0) return [defaultImage];
    return imagePaths.map(path => getImageSrc(path, defaultImage));
  }
  
  // Handle comma-separated paths
  const paths = imagePaths.split(',').filter(path => path.trim() !== '');
  
  if (paths.length === 0) return [defaultImage];
  
  return paths.map(path => getImageSrc(path.trim(), defaultImage));
};