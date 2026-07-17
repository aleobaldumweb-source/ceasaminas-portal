import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.18.120.101'],

  turbopack: {
    root: path.resolve(__dirname, '../..'),
  },

  experimental: {
    optimizePackageImports: ['@ceasaminas/ui'],
  },
};

export default nextConfig;
