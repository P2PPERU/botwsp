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

// Cliente axios configurado
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Cliente para WPPConnect directo
const wppClient = axios.create({
  baseURL: WPPCONNECT_URL,
  timeout: 10000,
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// API para sesiones de WhatsApp
export const sessionsAPI = {
  // Obtener estado de la sesión actual
  getStatus: async (): Promise<WPPConnectResponse> => {
    try {
      const response = await apiClient.get('/api/sessions/status');
      return response.data.data;
    } catch (error) {
      // Fallback a WPPConnect directo
      const response = await wppClient.get(`/api/${SESSION}/check-connection-session`);
      return response.data;
    }
  },

  // Iniciar nueva sesión
  startSession: async (sessionId: string = SESSION) => {
    try {
      const response = await apiClient.post('/api/sessions/start');
      return response.data;
    } catch (error) {
      const response = await wppClient.post(`/api/${sessionId}/start-session`, {
        webhook: "",
        waitQrCode: true,
        autoClose: 120
      });
      return response.data;
    }
  },

  // Obtener código QR
  getQRCode: async (sessionId: string = SESSION) => {
    try {
      const response = await apiClient.get('/api/sessions/qr');
      return response.data;
    } catch (error) {
      const response = await wppClient.get(`/api/${sessionId}/qrcode-session`);
      return response.data;
    }
  },

  // Cerrar sesión
  closeSession: async (sessionId: string = SESSION) => {
    try {
      const response = await apiClient.post('/api/sessions/close');
      return response.data;
    } catch (error) {
      const response = await wppClient.post(`/api/${sessionId}/close-session`);
      return response.data;
    }
  }
};

// API para mensajes
export const messagesAPI = {
  // Enviar mensaje
  send: async (data: SendMessageRequest): Promise<APIResponse<any>> => {
    try {
      const response = await apiClient.post('/api/messages/send', data);
      return {
        status: 'success',
        data: response.data
      };
    } catch (error) {
      // Fallback a WPPConnect directo
      const response = await wppClient.post(`/api/${SESSION}/send-message`, {
        phone: data.phone,
        message: data.message
      });
      return {
        status: 'success',
        data: response.data
      };
    }
  },

  // Obtener historial de mensajes
  getHistory: async (): Promise<WhatsAppMessage[]> => {
    try {
      const response = await apiClient.get('/api/messages/history');
      return response.data.data.messages || [];
    } catch (error) {
      // Datos de ejemplo si falla
      return [
        {
          id: '1',
          from: '51987654321',
          to: SESSION,
          message: 'Hola, necesito información sobre Netflix',
          time: new Date().toLocaleTimeString(),
          status: 'delivered',
          type: 'text',
          timestamp: Date.now(),
          fromMe: false
        },
        {
          id: '2',
          from: SESSION,
          to: '51987654321',
          message: '¡Hola! Te ayudo con información sobre Netflix Premium.',
          time: new Date().toLocaleTimeString(),
          status: 'read',
          type: 'text',
          timestamp: Date.now(),
          fromMe: true
        }
      ];
    }
  },

  // Marcar mensajes como leídos
  markAsRead: async (messageIds: string[]) => {
    try {
      const response = await apiClient.put('/api/messages/mark-read', { messageIds });
      return response.data;
    } catch (error) {
      return { success: true };
    }
  },

  // Obtener estadísticas de mensajes
  getStats: async () => {
    try {
      const response = await apiClient.get('/api/messages/stats');
      return response.data.data;
    } catch (error) {
      return { total: 0, today: 0, sent: 0, received: 0 };
    }
  }
};

// API para clientes
export const clientsAPI = {
  // Obtener todos los clientes
  getAll: async (): Promise<Client[]> => {
    try {
      const response = await apiClient.get('/api/clients');
      return response.data.data.clients || [];
    } catch (error) {
      // Datos de ejemplo si falla
      return [
        {
          id: 1,
          name: "Juan Pérez",
          phone: "51987654321",
          service: "Netflix Premium",
          expiry: "2025-05-25",
          status: "active"
        },
        {
          id: 2,
          name: "María García",
          phone: "51923456789",
          service: "Disney+ Familiar",
          expiry: "2025-05-24",
          status: "expiring"
        },
        {
          id: 3,
          name: "Carlos López",
          phone: "51956789123",
          service: "Prime Video",
          expiry: "2025-05-22",
          status: "expired"
        }
      ];
    }
  },

  // Crear nuevo cliente
  create: async (client: Omit<Client, 'id'>): Promise<Client> => {
    try {
      const response = await apiClient.post('/api/clients', client);
      return response.data.data;
    } catch (error) {
      return { ...client, id: Math.floor(Math.random() * 1000) };
    }
  },

  // Actualizar cliente
  update: async (id: number, client: Partial<Client>): Promise<Client> => {
    try {
      const response = await apiClient.put(`/api/clients/${id}`, client);
      return response.data.data;
    } catch (error) {
      return { id, ...client } as Client;
    }
  },

  // Eliminar cliente
  delete: async (id: number): Promise<boolean> => {
    try {
      await apiClient.delete(`/api/clients/${id}`);
      return true;
    } catch (error) {
      return true;
    }
  },

  // Obtener clientes próximos a vencer
  getExpiring: async (days: number = 7) => {
    try {
      const response = await apiClient.get(`/api/clients/expiring?days=${days}`);
      return response.data.data;
    } catch (error) {
      return { clients: [], count: 0 };
    }
  },

  // Importar clientes
  importClients: async (data: { clients: Client[] }) => {
    try {
      const response = await apiClient.post('/api/clients/import', data);
      return response.data;
    } catch (error: any) {
      return {
        imported: 0,
        skipped: 0,
        errors: [{ error: 'Import failed', details: error.message }]
      };
    }
  }
};

// API para workflows de n8n
export const workflowsAPI = {
  // Obtener workflows activos
  getActive: async (): Promise<N8nWorkflow[]> => {
    try {
      const response = await apiClient.get('/api/workflows');
      return response.data.data || [];
    } catch (error) {
      // Datos de ejemplo si falla
      return [
        {
          id: '1',
          name: 'Recordatorios de Vencimiento',
          status: 'active',
          lastRun: '9:00 AM',
          triggers: 15
        },
        {
          id: '2',
          name: 'Respuestas Automáticas GPT',
          status: 'active',
          lastRun: '10:35 AM',
          triggers: 45
        },
        {
          id: '3',
          name: 'Backup Automático',
          status: 'active',
          lastRun: '2:00 AM',
          triggers: 1
        }
      ];
    }
  },

  // Ejecutar workflow
  trigger: async (workflowId: string, data?: any) => {
    try {
      const response = await apiClient.post(`/api/workflows/${workflowId}/execute`, { data });
      return response.data;
    } catch (error) {
      return { success: true, executionId: 'exec_123' };
    }
  },

  // Obtener estadísticas de workflows
  getStats: async () => {
    try {
      const response = await apiClient.get('/api/workflows/stats');
      return response.data.data;
    } catch (error) {
      return { total: 0, successful: 0, failed: 0 };
    }
  },

  // Health check de n8n
  healthCheck: async () => {
    try {
      const response = await apiClient.get('/api/workflows/health');
      return response.data;
    } catch (error) {
      return { success: false, error: 'n8n not available' };
    }
  }
};

// API para estadísticas - MEJORADA
export const statsAPI = {
  // Obtener estadísticas generales - MEJORADO
  getGeneral: async () => {
    try {
      const response = await apiClient.get('/api/stats');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Datos de ejemplo mejorados si falla
      return {
        clients: { 
          total: 3, 
          active: 2, 
          expiring: 1, 
          expired: 0,
          suspended: 0
        },
        messages: { 
          total: 45, 
          today: 12, 
          thisWeek: 67,
          thisMonth: 156,
          sent: 28, 
          received: 17 
        },
        messageTypes: {
          text: 40,
          file: 3,
          image: 2,
          audio: 0,
          video: 0
        },
        messageStatus: {
          sent: 25,
          delivered: 15,
          read: 5,
          failed: 0
        },
        wppConnect: { 
          connected: true, 
          session: SESSION,
          lastCheck: new Date().toISOString()
        },
        workflows: {
          total: 3,
          active: 3,
          paused: 0
        },
        performance: {
          uptime: Math.floor(Math.random() * 86400),
          responseTime: Math.floor(Math.random() * 200) + 50,
          averageResponseTime: 45
        },
        summary: {
          totalRevenue: 1250,
          activeRate: 85.5,
          responseRate: 92.3
        }
      };
    }
  },

  // NUEVO: Obtener estadísticas del sistema
  getSystem: async () => {
    try {
      const response = await apiClient.get('/api/stats/system');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching system stats:', error);
      // Datos de ejemplo del sistema si falla
      return {
        uptime: {
          process: Math.floor(Math.random() * 86400) + 3600, // Entre 1-24 horas
          system: Math.floor(Math.random() * 345600) + 86400 // Entre 1-4 días
        },
        memory: {
          rss: '45 MB',
          heapTotal: '12 MB', 
          heapUsed: '8 MB',
          external: '2 MB'
        },
        cpu: {
          usage: Math.floor(Math.random() * 30) + 5, // 5-35%
          loadAverage: [0.5, 0.7, 0.8]
        },
        wppConnect: {
          status: 'healthy',
          connected: true,
          session: SESSION
        },
        database: {
          status: 'connected',
          type: 'JSON Files',
          location: './data/'
        },
        nodejs: {
          version: process.version || 'v18.17.0',
          platform: 'linux',
          arch: 'x64'
        }
      };
    }
  },

  // NUEVO: Obtener estadísticas detalladas de clientes
  getClients: async () => {
    try {
      const response = await apiClient.get('/api/stats/clients');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching client stats:', error);
      return { 
        total: 3, 
        active: 2, 
        expiring: 1,
        expired: 0,
        suspended: 0,
        growth: {
          thisMonth: 2,
          lastMonth: 1,
          percentage: 100
        },
        byService: [
          { name: 'Netflix Premium', count: 1 },
          { name: 'Disney+ Familiar', count: 1 },
          { name: 'Prime Video', count: 1 }
        ]
      };
    }
  },

  // Obtener estadísticas de mensajes - MEJORADO
  getMessages: async () => {
    try {
      const response = await apiClient.get('/api/stats/messages');
      return response.data.data;
    } catch (error) {
      return { 
        total: 45, 
        today: 12,
        thisWeek: 67,
        thisMonth: 156,
        sent: 28,
        received: 17,
        byType: {
          text: 40,
          file: 3,
          image: 2,
          audio: 0
        },
        byStatus: {
          sent: 25,
          delivered: 15,
          read: 5,
          failed: 0
        },
        hourlyActivity: new Array(24).fill(0).map(() => Math.floor(Math.random() * 10))
      };
    }
  },

  // Obtener estadísticas del sistema
  getSystemPerformance: async () => {
    try {
      const response = await apiClient.get('/api/stats/system');
      return response.data.data;
    } catch (error) {
      return {
        uptime: Math.floor(Math.random() * 86400),
        memory: '128 MB',
        cpu: '15%',
        status: 'healthy',
        connections: {
          wpp: true,
          gpt: true,
          n8n: false
        }
      };
    }
  },

  // Obtener reporte diario
  getDailyReport: async (date?: string) => {
    try {
      const url = date ? `/api/stats/daily?date=${date}` : '/api/stats/daily';
      const response = await apiClient.get(url);
      return response.data.data;
    } catch (error) {
      return {
        date: new Date().toISOString().split('T')[0],
        summary: {
          totalMessages: 0,
          sentMessages: 0,
          receivedMessages: 0,
          uniqueContacts: 0
        },
        hourlyActivity: new Array(24).fill(0),
        topContacts: []
      };
    }
  }
};

// API para GPT - EXPANDIDA
export const gptAPI = {
  // Generar respuesta
  generateResponse: async (message: string, clientContext?: any) => {
    try {
      const response = await apiClient.post('/api/gpt/generate-response', {
        message,
        clientContext
      });
      return response.data;
    } catch (error) {
      throw new Error('Error generating GPT response');
    }
  },

  // NUEVO: Generar respuesta específica
  generateSpecific: async (type: string, data: any) => {
    try {
      const response = await apiClient.post('/api/gpt/generate-specific-response', {
        type,
        data
      });
      return response.data;
    } catch (error) {
      return { response: 'Lo siento, no puedo generar una respuesta en este momento.' };
    }
  },

  // Analizar intención
  analyzeIntent: async (message: string) => {
    try {
      const response = await apiClient.post('/api/gpt/analyze-intent', {
        message
      });
      return response.data;
    } catch (error) {
      return { intent: 'general' };
    }
  },

  // NUEVO: Mejorar mensaje
  enhanceMessage: async (message: string, improvements: string[] = []) => {
    try {
      const response = await apiClient.post('/api/gpt/enhance-message', {
        message,
        improvements
      });
      return response.data;
    } catch (error) {
      return { enhancedMessage: message };
    }
  },

  // NUEVO: Generar resumen de conversación
  generateSummary: async (messages: any[]) => {
    try {
      const response = await apiClient.post('/api/gpt/generate-summary', {
        messages
      });
      return response.data;
    } catch (error) {
      return { summary: 'Conversación sobre servicios de streaming.' };
    }
  },

  // NUEVO: Procesar múltiples mensajes
  processMultiple: async (messages: any[]) => {
    try {
      const response = await apiClient.post('/api/gpt/process-multiple-messages', {
        messages
      });
      return response.data;
    } catch (error) {
      return { results: [] };
    }
  },

  // NUEVO: Generar sugerencias
  generateSuggestions: async (message: string, clientContext?: any, count: number = 3) => {
    try {
      const response = await apiClient.post('/api/gpt/generate-suggestions', {
        message,
        clientContext,
        count
      });
      return response.data;
    } catch (error) {
      return { suggestions: [] };
    }
  },

  // Obtener configuración de GPT
  getConfig: async () => {
    try {
      const response = await apiClient.get('/api/gpt/config');
      return response.data.data;
    } catch (error) {
      return {
        configured: false,
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 500
      };
    }
  },

  // NUEVO: Obtener estadísticas de uso de GPT
  getUsageStats: async () => {
    try {
      const response = await apiClient.get('/api/gpt/usage-stats');
      return response.data.data;
    } catch (error) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        averageResponseTime: 0,
        cacheHitRate: 0
      };
    }
  },

  // Health check de GPT
  healthCheck: async () => {
    try {
      const response = await apiClient.get('/api/gpt/health');
      return response.data;
    } catch (error) {
      return { success: false, error: 'GPT not available' };
    }
  }
};

// API para webhooks
export const webhooksAPI = {
  // Health check de webhooks
  healthCheck: async () => {
    try {
      const response = await apiClient.get('/webhook/health');
      return response.data;
    } catch (error) {
      return { status: 'unhealthy' };
    }
  },

  // Probar webhook
  test: async (data: any) => {
    try {
      const response = await apiClient.post('/webhook/test', data);
      return response.data;
    } catch (error) {
      return { success: false, error: 'Webhook test failed' };
    }
  }
};

export default {
  sessions: sessionsAPI,
  messages: messagesAPI,
  clients: clientsAPI,
  workflows: workflowsAPI,
  stats: statsAPI,
  gpt: gptAPI,
  webhooks: webhooksAPI
};