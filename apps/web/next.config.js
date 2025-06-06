/** @type {import('next').NextConfig} */
const nextConfig = {
  // Временно отключаем Turbopack для стабильности
  // turbopack: {
  //   // Modern Turbopack configuration
  // },
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
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
  allowedDevOrigins: ['http://192.168.7.236:3000'],
};

module.exports = nextConfig;
