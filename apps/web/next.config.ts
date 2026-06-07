import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development', // Optionally disable in dev
});

const nextConfig: NextConfig = {
  // Add any Next.js config options here if needed
};

export default withSerwist(nextConfig);
