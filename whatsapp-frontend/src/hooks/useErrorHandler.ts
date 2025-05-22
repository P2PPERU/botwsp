// src/hooks/useErrorHandler.ts
import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast'; // Si usas toast, sino puedes usar alert

interface ErrorInfo {
  message: string;
  code?: string;
  status?: number;
  details?: any;
  isNetworkError?: boolean;
}

export function useErrorHandler() {
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleError = useCallback((error: any, context?: string) => {
    console.error(`Error in ${context || 'unknown context'}:`, error);

    let errorInfo: ErrorInfo = {
      message: 'Ha ocurrido un error inesperado',
      code: 'UNKNOWN_ERROR'
    };

    if (error.isNetworkError) {
      errorInfo = {
        message: 'No se puede conectar con el servidor. Verifica tu conexión.',
        code: 'NETWORK_ERROR',
        isNetworkError: true
      };
    } else if (error.response) {
      errorInfo = {
        message: error.response.data?.message || error.message,
        status: error.response.status,
        code: error.response.data?.code,
        details: error.response.data?.details
      };
    } else if (error.message) {
      errorInfo.message = error.message;
    }

    setError(errorInfo);

    // Mostrar notificación si tienes toast
    // toast.error(errorInfo.message);

    return errorInfo;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const retry = useCallback(async (callback: () => Promise<any>) => {
    setIsRetrying(true);
    clearError();
    
    try {
      const result = await callback();
      return result;
    } catch (error) {
      handleError(error, 'retry');
      throw error;
    } finally {
      setIsRetrying(false);
    }
  }, [handleError, clearError]);

  return {
    error,
    isRetrying,
    handleError,
    clearError,
    retry
  };
}