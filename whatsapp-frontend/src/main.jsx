import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './styles/index.css'

// Configuración de React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      cacheTime: 1000 * 60 * 10, // 10 minutos
      retry: (failureCount, error) => {
        // No reintentar en errores de autenticación
        if (error?.response?.status === 401) return false
        return failureCount < 3
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
})

// Configuración de toast notifications
const toasterConfig = {
  duration: 4000,
  position: 'top-right',
  reverseOrder: false,
  gutter: 8,
  containerClassName: '',
  containerStyle: {},
  toastOptions: {
    // Estilo base para todos los toasts
    style: {
      background: '#363636',
      color: '#fff',
      borderRadius: '12px',
      padding: '16px',
      fontSize: '14px',
      maxWidth: '400px',
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    // Configuración específica por tipo
    success: {
      duration: 3000,
      iconTheme: {
        primary: '#22c55e',
        secondary: '#fff',
      },
      style: {
        background: '#059669',
        color: '#fff',
      },
    },
    error: {
      duration: 5000,
      iconTheme: {
        primary: '#ef4444',
        secondary: '#fff',
      },
      style: {
        background: '#dc2626',
        color: '#fff',
      },
    },
    loading: {
      iconTheme: {
        primary: '#3b82f6',
        secondary: '#fff',
      },
      style: {
        background: '#2563eb',
        color: '#fff',
      },
    },
    // Toast personalizado para WhatsApp
    custom: {
      style: {
        background: '#25d366',
        color: '#fff',
      },
    },
  },
}

// Función para manejar errores globales
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  
  // Solo mostrar toast si es un error de red o API
  if (event.reason?.response || event.reason?.code === 'NETWORK_ERROR') {
    import('react-hot-toast').then(({ default: toast }) => {
      toast.error('Error de conexión. Verifica tu internet.')
    })
  }
})

// Configuración de desarrollo
if (import.meta.env.DEV) {
  // Habilitar React DevTools
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = window.__REACT_DEVTOOLS_GLOBAL_HOOK__ || {}
  
  // Log de configuración en desarrollo
  console.log('🚀 WhatsApp Hub Frontend')
  console.log('📦 Mode:', import.meta.env.MODE)
  console.log('🔗 API URL:', import.meta.env.VITE_API_URL)
  console.log('🎯 Environment:', import.meta.env.DEV ? 'Development' : 'Production')
}

// Función para verificar soporte del navegador
const checkBrowserSupport = () => {
  const requiredFeatures = [
    'fetch',
    'Promise',
    'localStorage',
    'sessionStorage',
    'WebSocket'
  ]
  
  const unsupported = requiredFeatures.filter(feature => !(feature in window))
  
  if (unsupported.length > 0) {
    console.warn('⚠️ Unsupported browser features:', unsupported)
    
    // Mostrar mensaje de navegador no compatible
    document.body.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        font-family: system-ui, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        text-align: center;
        padding: 20px;
      ">
        <div>
          <h1 style="font-size: 24px; margin-bottom: 16px;">
            Navegador No Compatible
          </h1>
          <p style="font-size: 16px; margin-bottom: 20px;">
            Tu navegador no soporta las características necesarias para WhatsApp Hub.
          </p>
          <p style="font-size: 14px; opacity: 0.8;">
            Por favor, actualiza tu navegador o usa Chrome, Firefox, Safari o Edge.
          </p>
        </div>
      </div>
    `
    return false
  }
  
  return true
}

// Verificar soporte antes de renderizar
if (!checkBrowserSupport()) {
  // No renderizar si el navegador no es compatible
} else {
  // Renderizar la aplicación
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
          <Toaster {...toasterConfig} />
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>,
  )
}

// Hot Module Replacement (HMR) para desarrollo
if (import.meta.hot) {
  import.meta.hot.accept()
}