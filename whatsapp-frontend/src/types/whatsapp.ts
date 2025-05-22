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
  createdAt?: string;
  updatedAt?: string;
  suspensionReason?: string;
  suspendedAt?: string;
  reactivatedAt?: string;
  notes?: string;
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

// Tipos para estadísticas de mensajes
export interface MessageStats {
  today: number;
  total: number;
  thisWeek: number;
  thisMonth: number;
}

// Tipos para estadísticas de clientes
export interface ClientStats {
  active: number;
  expiring: number;
  expired: number;
  suspended: number;
  total: number;
}

// Tipos para estadísticas por tipo de mensaje
export interface MessageTypeStats {
  text: number;
  file: number;
  image: number;
  audio: number;
  document: number;
}

// Tipos para estadísticas por estado de mensaje
export interface MessageStatusStats {
  sent: number;
  delivered: number;
  read: number;
  failed: number;
}

// Tipos para resumen general
export interface SummaryStats {
  responseRate: number;
  totalRevenue: number;
  avgResponseTime: number;
  customerSatisfaction: number;
}

// Tipos para estadísticas del sistema
export interface SystemStats {
  uptime: {
    process: number;
    system: number;
  };
  memory: {
    heapUsed: string;
    heapTotal: string;
    external: string;
    rss: string;
  };
  nodejs: {
    version: string;
    platform: string;
    arch: string;
  };
  database: {
    type: string;
    status: string;
    connections?: number;
  };
  performance: {
    cpu: number;
    loadAverage: number[];
  };
}

// Tipos para estadísticas del dashboard - ACTUALIZADO
export interface DashboardStats {
  // Propiedades originales
  activeSessions: number;
  messagesTotal: number;
  messagesDay: number;
  activeClients: number;
  expiringClients: number;
  activeWorkflows: number;
  
  // Nuevas propiedades anidadas que usa el código
  messages: MessageStats;
  clients: ClientStats;
  messageTypes: MessageTypeStats;
  messageStatus: MessageStatusStats;
  summary: SummaryStats;
}

// Tipo combinado para respuesta completa del dashboard
export interface FullDashboardData {
  stats: DashboardStats;
  systemStats: SystemStats;
  clients: Client[];
  messages: WhatsAppMessage[];
  workflows: N8nWorkflow[];
  sessionStatus: WPPConnectResponse;
}