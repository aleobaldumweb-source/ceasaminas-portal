import path from 'node:path';
import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.18.120.101'],
  turbopack: { root: path.resolve(__dirname, '../..') },
  experimental: { optimizePackageImports: ['@ceasaminas/ui'] },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '3333', pathname: '/uploads/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '3333', pathname: '/uploads/**' },
      { protocol: 'https', hostname: 'minas1.ceasa.mg.gov.br', pathname: '/**' },
      { protocol: 'https', hostname: 'www.ceasaminas.com.br', pathname: '/**' },
    ],
  },
};
export default nextConfig;
