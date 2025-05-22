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
    const response = await wppClient.get(`/api/${SESSION}/check-connection-session`);
    return response.data;
  },

  // Iniciar nueva sesión
  startSession: async (sessionId: string = SESSION) => {
    const response = await wppClient.post(`/api/${sessionId}/start-session`, {
      webhook: "",
      waitQrCode: true,
      autoClose: 120
    });
    return response.data;
  },

  // Obtener código QR
  getQRCode: async (sessionId: string = SESSION) => {
    const response = await wppClient.get(`/api/${sessionId}/qrcode-session`);
    return response.data;
  },

  // Cerrar sesión
  closeSession: async (sessionId: string = SESSION) => {
    const response = await wppClient.post(`/api/${sessionId}/close-session`);
    return response.data;
  }
};

// API para mensajes
export const messagesAPI = {
  // Enviar mensaje
  send: async (data: SendMessageRequest): Promise<APIResponse<any>> => {
    const response = await wppClient.post(`/api/${SESSION}/send-message`, {
      phone: data.phone,
      message: data.message
    });
    return {
      status: 'success',
      data: response.data
    };
  },

  // Obtener historial de mensajes
  getHistory: async (): Promise<WhatsAppMessage[]> => {
    // Aquí implementarías la lógica para obtener mensajes
    // Por ahora retornamos datos de ejemplo
    return [
      {
        id: '1',
        from: '51987654321',
        to: SESSION,
        message: 'Hola, necesito información sobre Netflix',
        time: '10:30 AM',
        status: 'delivered',
        type: 'text',
        timestamp: Date.now(),
        fromMe: false
      }
    ];
  },

  // Marcar mensajes como leídos
  markAsRead: async (messageIds: string[]) => {
    // Implementar lógica para marcar como leído
    return { success: true };
  }
};

// API para clientes
export const clientsAPI = {
  // Obtener todos los clientes
  getAll: async (): Promise<Client[]> => {
    // Por ahora retorna datos de ejemplo
    // Posteriormente se conectará con Google Sheets
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
      }
    ];
  },

  // Crear nuevo cliente
  create: async (client: Omit<Client, 'id'>): Promise<Client> => {
    // Implementar creación de cliente
    return { ...client, id: Math.floor(Math.random() * 1000) };
  },

  // Actualizar cliente
  update: async (id: number, client: Partial<Client>): Promise<Client> => {
    // Implementar actualización
    return { id, ...client } as Client;
  },

  // Eliminar cliente
  delete: async (id: number): Promise<boolean> => {
    // Implementar eliminación
    return true;
  }
};

// API para workflows de n8n
export const workflowsAPI = {
  // Obtener workflows activos
  getActive: async (): Promise<N8nWorkflow[]> => {
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
      }
    ];
  },

  // Ejecutar workflow
  trigger: async (workflowId: string, data?: any) => {
    // Implementar ejecución de workflow
    return { success: true, executionId: 'exec_123' };
  }
};

// API para GPT
export const gptAPI = {
  // Generar respuesta
  generateResponse: async (message: string, context?: string) => {
    try {
      const response = await apiClient.post('/api/gpt/respond', {
        message,
        context
      });
      return response.data;
    } catch (error) {
      throw new Error('Error generating GPT response');
    }
  }
};

export default {
  sessions: sessionsAPI,
  messages: messagesAPI,
  clients: clientsAPI,
  workflows: workflowsAPI,
  gpt: gptAPI
};