import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimizaciones experimentales
  experimental: {
    // Optimizaciones de memoria en webpack
    webpackMemoryOptimizations: true,
  },

  // Configuración de webpack
  webpack: (config, { dev, isServer }) => {
    // Optimizaciones para desarrollo
    if (dev) {
      // Configurar watch options para reducir uso de memoria
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.git', '**/.next'],
      };
      
      // Configurar caché de memoria más eficiente
      config.cache = {
        type: 'memory',
        maxGenerations: 1,
      };
      
      // Optimizar resolución de módulos
      config.resolve.symlinks = false;
    }

    // Optimizaciones generales
    if (config.optimization) {
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      };
    }

    return config;
  },

  // Desactivar source maps en producción para ahorrar memoria
  productionBrowserSourceMaps: false,

  // Configuración de imágenes
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // Configuración del compilador
  compiler: {
    // Remover console.log en producción
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Configurar headers de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  // Configuración básica
  poweredByHeader: false,
  reactStrictMode: true,
  // swcMinify eliminado - está habilitado por defecto en Next.js 15+
};

export default nextConfig;