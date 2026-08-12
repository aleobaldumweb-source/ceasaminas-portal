import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  allowedDevOrigins: ['10.18.120.101'],

  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3333',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3333',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '10.18.120.101',
        port: '3333',
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
