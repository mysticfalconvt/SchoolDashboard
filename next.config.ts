import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  compiler: {
    // ssr and displayName are configured by default
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
