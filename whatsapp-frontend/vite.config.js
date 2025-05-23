import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Configuración de React Fast Refresh
      fastRefresh: true,
      // Incluir archivos .jsx
      include: "**/*.{jsx,tsx}",
    })
  ],
  
  // Configuración de resolución de módulos
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@context': path.resolve(__dirname, './src/context'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@styles': path.resolve(__dirname, './src/styles'),
    }
  },
  
  // Configuración del servidor de desarrollo
  server: {
    port: 3000,
    host: true, // Permite conexiones externas
    open: true, // Abre el navegador automáticamente
    cors: true,
    proxy: {
      // Proxy para las peticiones a la API
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  },
  
  // Configuración de construcción
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar vendors para mejor caching
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['framer-motion', 'lucide-react'],
          charts: ['recharts'],
          utils: ['axios', 'date-fns', 'clsx'],
          query: ['@tanstack/react-query'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod']
        }
      }
    },
    // Configuración de terser para minificación
    terserOptions: {
      compress: {
        drop_console: true, // Remover console.log en producción
        drop_debugger: true
      }
    }
  },
  
  // Optimización de dependencias
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom', 
      'axios', 
      'framer-motion',
      '@tanstack/react-query',
      'react-hot-toast',
      'lucide-react',
      'date-fns',
      'clsx'
    ],
    exclude: ['@vite/client', '@vite/env']
  },
  
  // Variables de entorno
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  
  // Configuración de CSS
  css: {
    postcss: './postcss.config.js',
    devSourcemap: true
  },
  
  // Configuración para preview
  preview: {
    port: 4173,
    host: true,
    cors: true
  }
})