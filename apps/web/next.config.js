/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove experimental turbo config - using stable Turbopack
  turbopack: {
    // Modern Turbopack configuration
  },
  webpack(config) {
    // Handle SVG files with SVGR
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
  transpilePackages: ['@mcp-analyzer/ui', '@mcp-analyzer/shared'],
  images: {
    domains: ['via.placeholder.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
