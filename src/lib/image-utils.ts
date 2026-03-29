/**
 * Image Optimization Utilities
 * 
 * Architecture:
 * - Uploads: Cloudinary (with watermark) — FREE tier (25 credits/day = 750/month)
 * - Display: next/image + sharp — FREE (AVIF/WebP auto-conversion)
 * - Future scaling: Migrate storage to Cloudflare R2 (~$5-15/month vs Cloudinary $89/month)
 * 
 * Note: next/image handles format conversion (AVIF > WebP > JPEG) automatically via sharp.
 * This file provides additional Cloudinary URL transformations for bonus optimization
 * when images are served directly from Cloudinary CDN.
 */

/**
 * Optimize a Cloudinary image URL with on-the-fly transformations
 * This adds Cloudinary-level optimizations ON TOP of next/image's sharp processing
 */
export function optimizeCloudinaryUrl(url: string, options?: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
  fit?: 'cover' | 'contain' | 'fill' | 'crop';
  gravity?: 'auto' | 'center' | 'face' | 'faces';
}): string {
  if (!url) return '';

  // Only apply to Cloudinary URLs
  if (!url.includes('cloudinary.com')) {
    return url;
  }

  const {
    width,
    height,
    quality = 80,
    format = 'auto',
    fit = 'cover',
    gravity = 'auto',
  } = options || {};

  try {
    const urlObj = new URL(url);
    const transformations: string[] = [];

    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);
    if (quality) transformations.push(`q_${quality}`);
    if (format === 'auto') {
      transformations.push('f_auto');
    } else if (format) {
      transformations.push(`f_${format}`);
    }
    transformations.push(`c_${fit}`);
    if (gravity === 'auto') {
      transformations.push('g_auto');
    } else if (gravity) {
      transformations.push(`g_${gravity}`);
    }
    transformations.push('dpr_auto');

    const transformString = transformations.join(',');
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
 * Generate a lightweight SVG blur placeholder for progressive loading
 */
export function getBlurPlaceholder(width: number = 10, height: number = 10): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="#f0f0f0"/>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * next/image sizes configurations for different components
 * Used as reference — actual sizes are set in the components
 */
export const ImageSizes = {
  /** Product card in grid: 2 cols mobile, 3 tablet, 4-5 desktop */
  productCard: '(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw',
  /** Product detail page: full width mobile, half desktop */
  productDetail: '(max-width: 1024px) 100vw, 50vw',
  /** Cart/favorites sidebar thumbnails */
  thumbnail: '80px',
  /** Banner/hero images */
  banner: '100vw',
} as const;

/**
 * Quality presets for different contexts
 */
export const QualityPresets = {
  productCard: 80,
  productDetail: 85,
  thumbnail: 75,
  banner: 85,
  avatar: 80,
} as const;
