// src/hooks/useConnectionStatus.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';

interface ConnectionStatus {
  whatsapp: {
    connected: boolean;
    session: string | null;
    error: string | null;
    lastCheck: Date | null;
    isChecking: boolean;
  };
  backend: {
    connected: boolean;
    error: string | null;
    lastCheck: Date | null;
    isChecking: boolean;
  };
  gpt: {
    configured: boolean;
    error: string | null;
  };
  n8n: {
    connected: boolean;
    error: string | null;
  };
}

interface UseConnectionStatusOptions {
  checkInterval?: number; // en milisegundos
  enableAutoReconnect?: boolean;
  onConnectionChange?: (status: ConnectionStatus) => void;
}

export function useConnectionStatus(options: UseConnectionStatusOptions = {}) {
  const {
    checkInterval = 30000, // 30 segundos por defecto
    enableAutoReconnect = true,
    onConnectionChange
  } = options;

  const [status, setStatus] = useState<ConnectionStatus>({
    whatsapp: {
      connected: false,
      session: null,
      error: null,
      lastCheck: null,
      isChecking: true
    },
    backend: {
      connected: false,
      error: null,
      lastCheck: null,
      isChecking: true
    },
    gpt: {
      configured: false,
      error: null
    },
    n8n: {
      connected: false,
      error: null
    }
  });

  const [isReconnecting, setIsReconnecting] = useState(false);
  
  // Usar refs para evitar recrear funciones y causar bucles
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isCheckingRef = useRef(false);
  const lastCheckTimeRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const maxReconnectAttempts = 3;
  const minTimeBetweenChecks = 5000; // 5 segundos mínimo entre verificaciones

  // Verificar conexión WhatsApp
  const checkWhatsAppConnection = useCallback(async () => {
    if (isCheckingRef.current) return false;
    
    setStatus(prev => ({
      ...prev,
      whatsapp: { ...prev.whatsapp, isChecking: true }
    }));

    try {
      const response = await api.sessions.getStatus();
      
      setStatus(prev => ({
        ...prev,
        whatsapp: {
          connected: response.status === true,
          session: response.session || null,
          error: null,
          lastCheck: new Date(),
          isChecking: false
        }
      }));

      if (response.status === true) {
        reconnectAttemptsRef.current = 0;
      }

      return response.status === true;
    } catch (error: any) {
      setStatus(prev => ({
        ...prev,
        whatsapp: {
          connected: false,
          session: null,
          error: error.message || 'Error al verificar conexión',
          lastCheck: new Date(),
          isChecking: false
        }
      }));
      return false;
    }
  }, []);

  // Verificar conexión Backend
  const checkBackendConnection = useCallback(async () => {
    setStatus(prev => ({
      ...prev,
      backend: { ...prev.backend, isChecking: true }
    }));

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/health`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const isConnected = response.ok;

      setStatus(prev => ({
        ...prev,
        backend: {
          connected: isConnected,
          error: null,
          lastCheck: new Date(),
          isChecking: false
        }
      }));

      return isConnected;
    } catch (error: any) {
      setStatus(prev => ({
        ...prev,
        backend: {
          connected: false,
          error: error.name === 'AbortError' ? 'Timeout de conexión' : 'Backend no disponible',
          lastCheck: new Date(),
          isChecking: false
        }
      }));
      return false;
    }
  }, []);

  // Verificar GPT
  const checkGPTConfiguration = useCallback(async () => {
    try {
      const config = await api.gpt.getConfig();
      
      setStatus(prev => ({
        ...prev,
        gpt: {
          configured: config?.configured || false,
          error: config?.configured ? null : 'OpenAI API key no configurada'
        }
      }));

      return config?.configured || false;
    } catch (error: any) {
      setStatus(prev => ({
        ...prev,
        gpt: {
          configured: false,
          error: 'Error al verificar configuración GPT'
        }
      }));
      return false;
    }
  }, []);

  // Verificar n8n
  const checkN8nConnection = useCallback(async () => {
    try {
      const health = await api.workflows.healthCheck();
      
      setStatus(prev => ({
        ...prev,
        n8n: {
          connected: health?.success || false,
          error: health?.success ? null : 'n8n no disponible'
        }
      }));

      return health?.success || false;
    } catch (error: any) {
      setStatus(prev => ({
        ...prev,
        n8n: {
          connected: false,
          error: 'Error al conectar con n8n'
        }
      }));
      return false;
    }
  }, []);

  // Verificar todas las conexiones con protección anti-spam
  const checkAllConnections = useCallback(async () => {
    // Verificar tiempo mínimo entre checks
    const now = Date.now();
    if (now - lastCheckTimeRef.current < minTimeBetweenChecks) {
      console.log('Skipping check - too soon');
      return;
    }
    
    // Prevenir checks simultáneos
    if (isCheckingRef.current) {
      console.log('Check already in progress');
      return;
    }
    
    isCheckingRef.current = true;
    lastCheckTimeRef.current = now;

    try {
      // Cancelar cualquier request anterior
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const results = await Promise.allSettled([
        checkBackendConnection(),
        checkWhatsAppConnection(),
        checkGPTConfiguration(),
        checkN8nConnection()
      ]);

      // Notificar cambios si se proporcionó callback
      if (onConnectionChange) {
        setStatus(currentStatus => {
          onConnectionChange(currentStatus);
          return currentStatus;
        });
      }

      return results;
    } finally {
      isCheckingRef.current = false;
    }
  }, [checkBackendConnection, checkWhatsAppConnection, checkGPTConfiguration, checkN8nConnection, onConnectionChange]);

  // Intentar reconectar WhatsApp
  const reconnectWhatsApp = useCallback(async () => {
    if (isReconnecting || reconnectAttemptsRef.current >= maxReconnectAttempts) {
      return false;
    }

    setIsReconnecting(true);
    reconnectAttemptsRef.current++;

    try {
      console.log(`Intento de reconexión ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);
      
      const statusCheck = await checkWhatsAppConnection();
      
      if (!statusCheck) {
        const startResult = await api.sessions.startSession();
        
        if (startResult.success) {
          await new Promise(resolve => setTimeout(resolve, 3000));
          await checkWhatsAppConnection();
        }
      }

      setIsReconnecting(false);
      return true;
    } catch (error) {
      console.error('Error en reconexión:', error);
      setIsReconnecting(false);
      return false;
    }
  }, [isReconnecting, checkWhatsAppConnection]);

  // Verificación inicial y configuración del intervalo
  useEffect(() => {
    let mounted = true;
    
    // Verificación inicial después de un pequeño delay
    const initialCheckTimeout = setTimeout(() => {
      if (mounted) {
        checkAllConnections();
      }
    }, 1000);

    // Configurar intervalo si está habilitado
    if (checkInterval > 0 && checkInterval >= minTimeBetweenChecks) {
      intervalRef.current = setInterval(() => {
        if (mounted) {
          checkAllConnections();
        }
      }, checkInterval);
    }

    return () => {
      mounted = false;
      clearTimeout(initialCheckTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [checkInterval]); // Solo depender de checkInterval, no de checkAllConnections

  // Auto-reconexión si está habilitada
  useEffect(() => {
    if (!enableAutoReconnect || isReconnecting) return;
    
    const shouldReconnect = !status.whatsapp.connected && 
                          status.backend.connected && 
                          reconnectAttemptsRef.current < maxReconnectAttempts;
    
    if (shouldReconnect) {
      const reconnectTimer = setTimeout(() => {
        reconnectWhatsApp();
      }, 10000); // Esperar 10 segundos antes de intentar reconectar

      return () => clearTimeout(reconnectTimer);
    }
  }, [status.whatsapp.connected, status.backend.connected, enableAutoReconnect, isReconnecting, reconnectWhatsApp]);

  return {
    status,
    isReconnecting,
    checkConnection: checkAllConnections,
    reconnectWhatsApp,
    reconnectAttempts: reconnectAttemptsRef.current,
    maxReconnectAttempts
  };
}

// Hook simplificado solo para WhatsApp
export function useWhatsAppStatus() {
  const { status, reconnectWhatsApp, isReconnecting } = useConnectionStatus({
    checkInterval: 30000 // Verificar cada 30 segundos
  });

  return {
    isConnected: status.whatsapp.connected,
    session: status.whatsapp.session,
    error: status.whatsapp.error,
    isChecking: status.whatsapp.isChecking,
    isReconnecting,
    reconnect: reconnectWhatsApp
  };
}