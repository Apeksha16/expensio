import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development', // Optionally disable in dev
});

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: 'v1.0.0',
  },
};

export default withSerwist(nextConfig);
