/**
 * Image Optimization Utilities
 * Uses Cloudinary transformations for automatic optimization
 */

/**
 * Optimize a Cloudinary image URL for the web
 * - Auto format (WebP for supported browsers, fallback to JPEG)
 * - Quality optimization
 * - Responsive sizing
 */
export function optimizeImage(url: string, options?: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
  fit?: 'cover' | 'contain' | 'fill' | 'crop';
  gravity?: 'auto' | 'center' | 'face' | 'faces';
}): string {
  if (!url) return '';

  // Skip optimization for non-Cloudinary URLs
  if (!url.includes('cloudinary.com') && !url.includes('res.cloudinary.com')) {
    return url;
  }

  const {
    width,
    height,
    quality = 80, // Good balance between quality and file size
    format = 'auto',
    fit = 'cover',
    gravity = 'auto',
  } = options || {};

  try {
    const urlObj = new URL(url);

    // Build transformation string
    const transformations: string[] = [];

    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);
    if (quality) transformations.push(`q_${quality}`);
    if (format === 'auto') {
      transformations.push('f_auto'); // Auto format (WebP/AVIF)
    } else if (format) {
      transformations.push(`f_${format}`);
    }
    transformations.push(`c_${fit}`);
    if (gravity === 'auto') {
      transformations.push('g_auto'); // Smart cropping
    } else if (gravity) {
      transformations.push(`g_${gravity}`);
    }

    // Add dpr (device pixel ratio) hint
    transformations.push('dpr_auto');

    const transformString = transformations.join(',');

    // Cloudinary URL structure:
    // https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{public_id}
    const pathParts = urlObj.pathname.split('/');
    const uploadIndex = pathParts.indexOf('upload');

    if (uploadIndex !== -1) {
      pathParts.splice(uploadIndex + 1, 0, transformString);
      urlObj.pathname = pathParts.join('/');
    }

    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(url: string, baseWidth: number): string {
  if (!url.includes('cloudinary.com')) return '';

  const sizes = [300, 400, 600, 800, 1000, 1200];
  const srcSet = sizes
    .filter(w => w >= baseWidth * 0.5 && w <= baseWidth * 2)
    .map(w => `${optimizeImage(url, { width: w })} ${w}w`)
    .join(', ');

  return srcSet;
}

/**
 * Get placeholder (blur) data URL for image loading
 */
export function getBlurPlaceholder(width: number = 10, height: number = 10): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="#f0f0f0"/>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Predefined image size presets for different contexts
 */
export const ImagePresets = {
  // Product card thumbnail
  productCard: { width: 400, height: 400, quality: 80 },
  // Product detail page main image
  productDetail: { width: 800, height: 800, quality: 85 },
  // Banner/hero image
  banner: { width: 1920, height: 600, quality: 85 },
  // Category thumbnail
  category: { width: 200, height: 200, quality: 80 },
  // Avatar/profile image
  avatar: { width: 150, height: 150, quality: 80 },
  // Thumbnail (gallery, etc)
  thumbnail: { width: 100, height: 100, quality: 75 },
} as const;
