/** @type {import('next').NextConfig} */
const nextConfig = {
  // Experimental features for faster builds
  experimental: {
    // Enable faster transpilation
    esmExternals: true,
    // Optimize CSS handling
    optimizeCss: true,
  },
  
  // Image configuration (your existing setup)
  images: {
    // Allow images from Django backend
    domains: ['127.0.0.1', 'localhost'],
    // Disable image optimization in development for faster builds
    unoptimized: true,
    // Remote patterns for more control
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8080',
        pathname: '/media/**',
      },
      {
        protocol: 'http', 
        hostname: 'localhost',
        port: '8080',
        pathname: '/media/**',
      },
    ],
  },
  
  // REMOVED: webpack config (conflicts with Turbopack)
  // Turbopack handles optimization automatically
  
  // Exclude unnecessary files from compilation
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  
  // Reduce TypeScript checking in development
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Enable output file tracing for faster builds
  output: 'standalone'
};

module.exports = nextConfig;
