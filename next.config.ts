import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Prevent OneDrive/Windows file locking and symlink cache issues
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
