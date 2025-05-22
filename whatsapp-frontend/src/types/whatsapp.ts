// Tipos para sesiones de WhatsApp
export interface WhatsAppSession {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'connecting';
  lastActivity: string;
  qrCode?: string;
}

// Tipos para mensajes
export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  message: string;
  time: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  type: 'text' | 'image' | 'document' | 'audio';
  timestamp: number;
  fromMe: boolean;
}

// Tipos para clientes
export interface Client {
  id: number;
  name: string;
  phone: string;
  service: string;
  expiry: string;
  status: 'active' | 'expiring' | 'expired' | 'suspended';
  plan?: string;
  lastPayment?: string;
  createdAt?: string;        // ← Agregar
  updatedAt?: string;        // ← Agregar  
  suspensionReason?: string; // ← Agregar
  suspendedAt?: string;      // ← Agregar
  reactivatedAt?: string;    // ← Agregar
  notes?: string;            // ← Agregar
}

// Tipos para workflows de n8n
export interface N8nWorkflow {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'error';
  lastRun: string;
  triggers: number;
  description?: string;
}

// Tipos para configuración GPT
export interface GPTConfig {
  model: 'gpt-4' | 'gpt-3.5-turbo';
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

// Tipos para respuestas de API
export interface APIResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
}

// Tipos para WPPConnect API
export interface WPPConnectResponse {
  status: boolean;
  message?: string;
  session?: string;
  qrcode?: string;
}

// Tipos para envío de mensajes
export interface SendMessageRequest {
  phone: string;
  message: string;
  session?: string;
}

// Tipos para estadísticas del dashboard
export interface DashboardStats {
  activeSessions: number;
  messagesTotal: number;
  messagesDay: number;
  activeClients: number;
  expiringClients: number;
  activeWorkflows: number;
}