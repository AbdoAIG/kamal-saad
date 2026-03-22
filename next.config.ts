import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  
  // Security Headers
  async headers() {
    return [
      {
        // Apply to all routes EXCEPT auth routes
        source: '/((?!api/auth).*)',
        headers: [
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // XSS Protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Referrer Policy - needed for OAuth
          {
            key: 'Referrer-Policy',
            value: 'no-referrer-when-downgrade',
          },
        ],
      },
      // Static assets - caching
      {
        source: '/(.*)\\.(ico|png|jpg|jpeg|gif|svg|webp|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
