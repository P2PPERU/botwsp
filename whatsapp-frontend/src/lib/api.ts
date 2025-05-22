// src/lib/api.ts
import axios from 'axios';
import { 
  WhatsAppSession, 
  WhatsAppMessage, 
  Client, 
  N8nWorkflow, 
  SendMessageRequest,
  WPPConnectResponse,
  APIResponse 
} from '@/types/whatsapp';

// Configuración base de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const WPPCONNECT_URL = 'http://localhost:21465';
const SESSION = 'tes4';
const TOKEN = '$2b$10$NZPYrgMAeAN.7A2t2Xcka.aA2o_YxeL_SIuFacM7PsgfNpLi3n5f2';

// CONFIGURACIÓN TEMPORAL - Remover cuando el backend esté estable
const TEMP_CONFIG = {
  DISABLE_AUTO_CHECKS: true,
  DISABLE_GPT_CHECKS: true,
  DISABLE_N8N_CHECKS: true,
  REQUEST_TIMEOUT: 5000,
  MAX_RETRIES: 1,
  RETRY_DELAY: 1000
};

// Cliente axios configurado con interceptores mejorados
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: TEMP_CONFIG.REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Cliente para WPPConnect directo
const wppClient = axios.create({
  baseURL: WPPCONNECT_URL,
  timeout: TEMP_CONFIG.REQUEST_TIMEOUT,
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar timeout a todas las requests
apiClient.interceptors.request.use(
  (config) => {
    // Asegurar timeout en todas las requests
    config.timeout = config.timeout || TEMP_CONFIG.REQUEST_TIMEOUT;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor global para manejo de errores mejorado
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log más limpio del error
    if (error.code === 'ECONNABORTED') {
      console.warn('Request timeout:', error.config?.url);
    } else if (!error.response) {
      console.warn('Network error:', error.config?.url);
    } else if (error.response?.status >= 500) {
      console.warn('Server error:', error.config?.url, error.response?.status);
    }

    // Verificar si el backend está caído
    if (!error.response) {
      throw {
        message: 'No se puede conectar con el servidor',
        code: 'NETWORK_ERROR',
        isNetworkError: true
      };
    }

    // Re-lanzar el error para que lo maneje cada función
    throw error;
  }
);

// Helper para manejar reintentos
async function withRetry<T>(
  fn: () => Promise<T>, 
  retries = TEMP_CONFIG.MAX_RETRIES,
  delay = TEMP_CONFIG.RETRY_DELAY
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay);
    }
    throw error;
  }
}

// API para sesiones de WhatsApp
export const sessionsAPI = {
  getStatus: async (): Promise<WPPConnectResponse> => {
    return withRetry(async () => {
      try {
        const response = await apiClient.get('/api/sessions/status');
        return response.data.data;
      } catch (error: any) {
        console.warn('Error fetching session status:', error.message);
        throw {
          message: error.response?.data?.message || 'Error al verificar estado de sesión',
          status: error.response?.status || 500,
          details: error.response?.data?.details
        };
      }
    });
  },

  startSession: async (sessionId: string = SESSION) => {
    try {
      const response = await apiClient.post('/api/sessions/start');
      return response.data;
    } catch (error: any) {
      console.error('Error starting session:', error);
      throw {
        message: error.response?.data?.message || 'Error al iniciar sesión',
        status: error.response?.status || 500,
        details: error.response?.data?.details
      };
    }
  },

  getQRCode: async (sessionId: string = SESSION) => {
    try {
      const response = await apiClient.get('/api/sessions/qr');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching QR code:', error);
      throw {
        message: error.response?.data?.message || 'Error al obtener código QR',
        status: error.response?.status || 500,
        details: error.response?.data?.details
      };
    }
  },

  closeSession: async (sessionId: string = SESSION) => {
    try {
      const response = await apiClient.post('/api/sessions/close');
      return response.data;
    } catch (error: any) {
      console.error('Error closing session:', error);
      throw {
        message: error.response?.data?.message || 'Error al cerrar sesión',
        status: error.response?.status || 500,
        details: error.response?.data?.details
      };
    }
  }
};

// API para mensajes
export const messagesAPI = {
  send: async (data: SendMessageRequest): Promise<APIResponse<any>> => {
    try {
      const response = await apiClient.post('/api/messages/send', data);
      return response.data;
    } catch (error: any) {
      console.error('Error sending message:', error);
      throw {
        message: error.response?.data?.message || 'Error al enviar mensaje',
        status: error.response?.status || 500,
        details: error.response?.data?.details
      };
    }
  },

  sendFile: async (data: any): Promise<APIResponse<any>> => {
    try {
      const response = await apiClient.post('/api/messages/send-file', data);
      return response.data;
    } catch (error: any) {
      console.error('Error sending file:', error);
      throw {
        message: error.response?.data?.message || 'Error al enviar archivo',
        status: error.response?.status || 500,
        details: error.response?.data?.details
      };
    }
  },

  sendBulk: async (data: any): Promise<APIResponse<any>> => {
    try {
      const response = await apiClient.post('/api/messages/send-bulk', data);
      return response.data;
    } catch (error: any) {
      console.error('Error sending bulk messages:', error);
      throw {
        message: error.response?.data?.message || 'Error al enviar mensajes masivos',
        status: error.response?.status || 500,
        details: error.response?.data?.details
      };
    }
  },

  getHistory: async (): Promise<WhatsAppMessage[]> => {
    try {
      const response = await apiClient.get('/api/messages/history');
      return response.data.data?.messages || [];
    } catch (error: any) {
      console.warn('Error fetching message history:', error.message);
      return []; // Devolver array vacío en lugar de throw
    }
  },

  markAsRead: async (messageIds: string[]) => {
    try {
      const response = await apiClient.put('/api/messages/mark-read', { messageIds });
      return response.data;
    } catch (error: any) {
      console.error('Error marking messages as read:', error);
      throw {
        message: error.response?.data?.message || 'Error al marcar mensajes como leídos',
        status: error.response?.status || 500,
        details: error.response?.data?.details
      };
    }
  },

  getStats: async () => {
    try {
      const response = await apiClient.get('/api/messages/stats');
      return response.data.data;
    } catch (error: any) {
      console.warn('Error fetching message stats:', error.message);
      return null; // Devolver null en lugar de throw
    }
  }
};

// API para clientes
export const clientsAPI = {
  getAll: async (): Promise<Client[]> => {
    try {
      const response = await apiClient.get('/api/clients');
      return response.data.data?.clients || [];
    } catch (error: any) {
      console.warn('Error fetching clients:', error.message);
      return []; // Devolver array vacío en lugar de throw
    }
  },

  getById: async (id: number): Promise<Client> => {
    try {
      const response = await apiClient.get(`/api/clients/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching client:', error);
      throw {
        message: error.response?.data?.message || 'Error al cargar cliente',
        status: error.response?.status || 500,
        details: error.response?.data?.details
      };
    }
  },

  create: async (client: Omit<Client, 'id'>): Promise<Client> => {
    try {
      const response = await apiClient.post('/api/clients', client);
      return response.data.data;
    } catch (error: any) {
      console.error('Error creating client:', error);
      throw {
        message: error.response?.data?.message || 'Error al crear cliente',
        status: error.response?.status || 500,
        details: error.response?.data?.details
      };
    }
  },

  update: async (id: number, client: Partial<Client>): Promise<Client> => {
    try {
      const response = await apiClient.put(`/api/clients/${id}`, client);
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating client:', error);
      throw {
        message: error.response?.data?.message || 'Error al actualizar cliente',
        status: error.response?.status || 500,
        details: error.response?.data?.details
      };
    }
  },

  delete: async (id: number): Promise<boolean> => {
    try {
      await apiClient.delete(`/api/clients/${id}`);
      return true;
    } catch (error: any) {
      console.error('Error deleting client:', error);
      throw {
        message: error.response?.data?.message || 'Error al eliminar cliente',
        status: error.response?.status || 500,
        details: error.response?.data?.details
      };
    }
  },

  getExpiring: async (days: number = 7) => {
    try {
      const response = await apiClient.get(`/api/clients/expiring?days=${days}`);
      return response.data.data;
    } catch (error: any) {
      console.warn('Error fetching expiring clients:', error.message);
      return []; // Devolver array vacío en lugar de throw
    }
  },

  importClients: async (data: { clients: Client[] }) => {
    try {
      const response = await apiClient.post('/api/clients/import', data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error importing clients:', error);
      throw {
        message: error.response?.data?.message || 'Error al importar clientes',
        status: error.response?.status || 500,
        details: error.response?.data?.details
      };
    }
  },

  renewSubscription: async (id: number, data: { months?: number; newExpiry?: string }) => {
    try {
      const response = await apiClient.post(`/api/clients/${id}/renew`, data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error renewing subscription:', error);
      throw {
        message: error.response?.data?.message || 'Error al renovar suscripción',
        status: error.response?.status || 500,
        details: error.response?.data?.details
      };
    }
  },

  suspend: async (id: number, reason: string) => {
    try {
      const response = await apiClient.post(`/api/clients/${id}/suspend`, { reason });
      return response.data.data;
    } catch (error: any) {
      console.error('Error suspending client:', error);
      throw {
        message: error.response?.data?.message || 'Error al suspender cliente',
        status: error.response?.status || 500,
        details: error.response?.data?.details
      };
    }
  },

  reactivate: async (id: number) => {
    try {
      const response = await apiClient.post(`/api/clients/${id}/reactivate`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error reactivating client:', error);
      throw {
        message: error.response?.data?.message || 'Error al reactivar cliente',
        status: error.response?.status || 500,
        details: error.response?.data?.details
      };
    }
  }
};

// API para workflows de n8n - CON CHECKS DESHABILITADOS
export const workflowsAPI = {
  getActive: async (): Promise<N8nWorkflow[]> => {
    if (TEMP_CONFIG.DISABLE_N8N_CHECKS) {
      console.log('n8n checks disabled');
      return [];
    }
    
    try {
      const response = await apiClient.get('/api/workflows');
      return response.data.data || [];
    } catch (error: any) {
      console.warn('Error fetching workflows:', error.message);
      return []; // Devolver array vacío en lugar de throw
    }
  },

  getDetails: async (workflowId: string) => {
    if (TEMP_CONFIG.DISABLE_N8N_CHECKS) {
      return null;
    }
    
    try {
      const response = await apiClient.get(`/api/workflows/${workflowId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching workflow details:', error);
      throw {
        message: error.response?.data?.message || 'Error al cargar detalles del workflow',
        status: error.response?.status || 500,
        details: error.response?.data?.details
      };
    }
  },

  trigger: async (workflowId: string, data?: any) => {
    if (TEMP_CONFIG.DISABLE_N8N_CHECKS) {
      return { success: false, message: 'n8n disabled' };
    }
    
    try {
      const response = await apiClient.post(`/api/workflows/${workflowId}/execute`, { data });
      return response.data;
    } catch (error: any) {
      console.error('Error triggering workflow:', error);
      throw {
        message: error.response?.data?.message || 'Error al ejecutar workflow',
        status: error.response?.status || 500,
        details: error.response?.data?.details
      };
    }
  },

  toggle: async (workflowId: string, active: boolean) => {
    if (TEMP_CONFIG.DISABLE_N8N_CHECKS) {
      return { success: false, message: 'n8n disabled' };
    }
    
    try {
      const response = await apiClient.patch(`/api/workflows/${workflowId}/toggle`, { active });
      return response.data;
    } catch (error: any) {
      console.error('Error toggling workflow:', error);
      throw {
        message: error.response?.data?.message || 'Error al cambiar estado del workflow',
        status: error.response?.status || 500,
        details: error.response?.data?.details
      };
    }
  },

  getStats: async () => {
    if (TEMP_CONFIG.DISABLE_N8N_CHECKS) {
      return null;
    }
    
    try {
      const response = await apiClient.get('/api/workflows/stats');
      return response.data.data;
    } catch (error: any) {
      console.warn('Error fetching workflow stats:', error.message);
      return null;
    }
  },

  healthCheck: async () => {
    if (TEMP_CONFIG.DISABLE_N8N_CHECKS) {
      return { success: false, disabled: true };
    }
    
    try {
      const response = await apiClient.get('/api/workflows/health', {
        timeout: 3000 // Timeout más corto para health checks
      });
      return response.data;
    } catch (error: any) {
      // Solo log, no throw
      console.log('n8n health check failed (expected if not configured)');
      return { success: false, error: error.message };
    }
  }
};

// API para estadísticas
export const statsAPI = {
  getGeneral: async () => {
    try {
      const response = await apiClient.get('/api/stats');
      return response.data.data;
    } catch (error: any) {
      console.warn('Error fetching general stats:', error.message);
      return null; // Devolver null en lugar de throw
    }
  },

  getSystem: async () => {
    try {
      const response = await apiClient.get('/api/stats/system');
      return response.data.data;
    } catch (error: any) {
      console.warn('Error fetching system stats:', error.message);
      return null;
    }
  },

  getClients: async () => {
    try {
      const response = await apiClient.get('/api/stats/clients');
      return response.data.data;
    } catch (error: any) {
      console.warn('Error fetching client stats:', error.message);
      return null;
    }
  },

  getMessages: async () => {
    try {
      const response = await apiClient.get('/api/stats/messages');
      return response.data.data;
    } catch (error: any) {
      console.warn('Error fetching message stats:', error.message);
      return null;
    }
  },

  getDailyReport: async (date?: string) => {
    try {
      const url = date ? `/api/stats/daily?date=${date}` : '/api/stats/daily';
      const response = await apiClient.get(url);
      return response.data.data;
    } catch (error: any) {
      console.warn('Error fetching daily report:', error.message);
      return null;
    }
  }
};

// API para GPT - CON CHECKS DESHABILITADOS
export const gptAPI = {
  generateResponse: async (message: string, clientContext?: any) => {
    if (TEMP_CONFIG.DISABLE_GPT_CHECKS) {
      return { success: false, message: 'GPT disabled' };
    }
    
    try {
      const response = await apiClient.post('/api/gpt/generate-response', {
        message,
        clientContext
      });
      return response.data;
    } catch (error: any) {
      console.error('Error generating GPT response:', error);
      throw {
        message: error.response?.data?.message || 'Error al generar respuesta GPT',
        status: error.response?.status || 500,
        details: error.response?.data?.details
      };
    }
  },

  generateSpecific: async (type: string, data: any) => {
    if (TEMP_CONFIG.DISABLE_GPT_CHECKS) {
      return { success: false, message: 'GPT disabled' };
    }
    
    try {
      const response = await apiClient.post('/api/gpt/generate-specific-response', {
        type,
        data
      });
      return response.data;
    } catch (error: any) {
      console.error('Error generating specific response:', error);
      throw {
        message: error.response?.data?.message || 'Error al generar respuesta específica',
        status: error.response?.status || 500,
        details: error.response?.data?.details
      };
    }
  },

  analyzeIntent: async (message: string) => {
    if (TEMP_CONFIG.DISABLE_GPT_CHECKS) {
      return { success: false, message: 'GPT disabled' };
    }
    
    try {
      const response = await apiClient.post('/api/gpt/analyze-intent', {
        message
      });
      return response.data;
    } catch (error: any) {
      console.error('Error analyzing intent:', error);
      throw {
        message: error.response?.data?.message || 'Error al analizar intención',
        status: error.response?.status || 500,
        details: error.response?.data?.details
      };
    }
  },

  enhanceMessage: async (message: string, improvements: string[] = []) => {
    if (TEMP_CONFIG.DISABLE_GPT_CHECKS) {
      return { success: false, message: 'GPT disabled' };
    }
    
    try {
      const response = await apiClient.post('/api/gpt/enhance-message', {
        message,
        improvements
      });
      return response.data;
    } catch (error: any) {
      console.error('Error enhancing message:', error);
      throw {
        message: error.response?.data?.message || 'Error al mejorar mensaje',
        status: error.response?.status || 500,
        details: error.response?.data?.details
      };
    }
  },

  generateSummary: async (messages: any[]) => {
    if (TEMP_CONFIG.DISABLE_GPT_CHECKS) {
      return { success: false, message: 'GPT disabled' };
    }
    
    try {
      const response = await apiClient.post('/api/gpt/generate-summary', {
        messages
      });
      return response.data;
    } catch (error: any) {
      console.error('Error generating summary:', error);
      throw {
        message: error.response?.data?.message || 'Error al generar resumen',
        status: error.response?.status || 500,
        details: error.response?.data?.details
      };
    }
  },

  processMultiple: async (messages: any[]) => {
    if (TEMP_CONFIG.DISABLE_GPT_CHECKS) {
      return { success: false, message: 'GPT disabled' };
    }
    
    try {
      const response = await apiClient.post('/api/gpt/process-multiple-messages', {
        messages
      });
      return response.data;
    } catch (error: any) {
      console.error('Error processing multiple messages:', error);
      throw {
        message: error.response?.data?.message || 'Error al procesar múltiples mensajes',
        status: error.response?.status || 500,
        details: error.response?.data?.details
      };
    }
  },

  generateSuggestions: async (message: string, clientContext?: any, count: number = 3) => {
    if (TEMP_CONFIG.DISABLE_GPT_CHECKS) {
      return { success: false, message: 'GPT disabled' };
    }
    
    try {
      const response = await apiClient.post('/api/gpt/generate-suggestions', {
        message,
        clientContext,
        count
      });
      return response.data;
    } catch (error: any) {
      console.error('Error generating suggestions:', error);
      throw {
        message: error.response?.data?.message || 'Error al generar sugerencias',
        status: error.response?.status || 500,
        details: error.response?.data?.details
      };
    }
  },

  getConfig: async () => {
    if (TEMP_CONFIG.DISABLE_GPT_CHECKS) {
      return { configured: false, disabled: true };
    }
    
    try {
      const response = await apiClient.get('/api/gpt/config', {
        timeout: 3000 // Timeout más corto para config checks
      });
      return response.data.data || { configured: false };
    } catch (error: any) {
      // Solo log, no throw
      console.log('GPT config check failed (expected if not configured)');
      return { configured: false, error: error.message };
    }
  },

  getUsageStats: async () => {
    if (TEMP_CONFIG.DISABLE_GPT_CHECKS) {
      return null;
    }
    
    try {
      const response = await apiClient.get('/api/gpt/usage-stats');
      return response.data.data;
    } catch (error: any) {
      console.warn('Error fetching GPT usage stats:', error.message);
      return null;
    }
  },

  healthCheck: async () => {
    if (TEMP_CONFIG.DISABLE_GPT_CHECKS) {
      return { success: false, disabled: true };
    }
    
    try {
      const response = await apiClient.get('/api/gpt/health', {
        timeout: 3000
      });
      return response.data;
    } catch (error: any) {
      console.log('GPT health check failed (expected if not configured)');
      return { success: false, error: error.message };
    }
  }
};

// API para webhooks
export const webhooksAPI = {
  healthCheck: async () => {
    try {
      const response = await apiClient.get('/webhook/health', {
        timeout: 3000
      });
      return response.data;
    } catch (error: any) {
      console.warn('Error checking webhook health:', error.message);
      return { success: false, error: error.message };
    }
  },

  test: async (data: any) => {
    try {
      const response = await apiClient.post('/webhook/test', data);
      return response.data;
    } catch (error: any) {
      console.error('Error testing webhook:', error);
      throw {
        message: error.response?.data?.message || 'Error al probar webhook',
        status: error.response?.status || 500,
        details: error.response?.data?.details
      };
    }
  }
};

// Exportar todo junto
const api = {
  sessions: sessionsAPI,
  messages: messagesAPI,
  clients: clientsAPI,
  workflows: workflowsAPI,
  stats: statsAPI,
  gpt: gptAPI,
  webhooks: webhooksAPI
};

export default api;