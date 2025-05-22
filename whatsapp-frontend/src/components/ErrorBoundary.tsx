// src/components/ErrorBoundary.tsx
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home, MessageSquare } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Enviar error a servicio de logging (si tienes uno)
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    });
  };

  render() {
    if (this.state.hasError) {
      // Si hay un fallback personalizado, usarlo
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // UI de error por defecto
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            
            <h1 className="mt-4 text-xl font-semibold text-center text-gray-900">
              ¡Ups! Algo salió mal
            </h1>
            
            <p className="mt-2 text-sm text-center text-gray-600">
              {this.state.error?.message || 'Ha ocurrido un error inesperado'}
            </p>

            {/* Mostrar detalles en desarrollo */}
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-4 p-4 bg-gray-100 rounded text-xs">
                <summary className="cursor-pointer font-medium">
                  Detalles del error (solo en desarrollo)
                </summary>
                <pre className="mt-2 overflow-auto">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}

            <div className="mt-6 space-y-2">
              <button
                onClick={this.handleReset}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Intentar de nuevo
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                Ir al inicio
              </button>
            </div>

            {/* Contador de errores */}
            {this.state.errorCount > 2 && (
              <p className="mt-4 text-xs text-center text-gray-500">
                Si el problema persiste, contacta al soporte técnico
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook para usar en componentes funcionales
export function useErrorHandler() {
  return (error: Error, errorInfo?: { componentStack?: string }) => {
    console.error('Error handled by useErrorHandler:', error, errorInfo);
    throw error; // Esto lo capturará el ErrorBoundary
  };
}

// Componente específico para errores de API
export function APIErrorFallback({ 
  error, 
  resetError 
}: { 
  error: any; 
  resetError: () => void;
}) {
  const isNetworkError = error?.isNetworkError || error?.code === 'NETWORK_ERROR';
  const statusCode = error?.status;

  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {isNetworkError 
              ? 'Error de conexión' 
              : statusCode === 401 
              ? 'No autorizado'
              : statusCode === 404
              ? 'No encontrado'
              : 'Error del servidor'}
          </h3>
          <p className="mt-1 text-sm text-red-700">
            {error?.message || 'Ha ocurrido un error al procesar la solicitud'}
          </p>
          
          {isNetworkError && (
            <div className="mt-2 text-xs text-red-600">
              <p>Posibles causas:</p>
              <ul className="list-disc list-inside mt-1">
                <li>El servidor backend no está ejecutándose</li>
                <li>Problemas de conectividad de red</li>
                <li>URL de API incorrecta</li>
              </ul>
            </div>
          )}

          <button
            onClick={resetError}
            className="mt-3 text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    </div>
  );
}