// src/lib/messaging-api.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface MessagePayload {
  phone: string;
  message: string;
  type?: 'text' | 'image' | 'document' | 'audio';
}

export interface BulkMessagePayload {
  phones: string[];
  message: string;
  delay?: number;
  bulkId?: string;
}

export interface FileMessagePayload {
  phone: string;
  file: string; // base64
  filename: string;
  caption?: string;
}

export interface GPTRequest {
  message: string;
  clientContext?: {
    name?: string;
    service?: string;
    status?: string;
    expiry?: string;
  };
}

class MessagingAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // =================== MENSAJES ===================
  
  async sendMessage(payload: MessagePayload) {
    try {
      const response = await axios.post(`${this.baseURL}/api/messages/send`, payload);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  }

  async sendFile(payload: FileMessagePayload) {
    try {
      const response = await axios.post(`${this.baseURL}/api/messages/send-file`, payload);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Error sending file:', error);
      return { success: false, error: error.message };
    }
  }

  async sendBulkMessage(payload: BulkMessagePayload) {
    try {
      const response = await axios.post(`${this.baseURL}/api/messages/send-bulk`, payload);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Error sending bulk message:', error);
      return { success: false, error: error.message };
    }
  }

  async getMessageHistory(filters?: {
    phone?: string;
    type?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) queryParams.append(key, value.toString());
        });
      }
      
      const response = await axios.get(`${this.baseURL}/api/messages/history?${queryParams}`);
      return { success: true, data: response.data.data };
    } catch (error: any) {
      console.error('Error getting message history:', error);
      return { success: false, error: error.message };
    }
  }

  async markMessagesAsRead(messageIds: string[]) {
    try {
      const response = await axios.put(`${this.baseURL}/api/messages/mark-read`, { messageIds });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Error marking messages as read:', error);
      return { success: false, error: error.message };
    }
  }

  async getMessageStats() {
    try {
      const response = await axios.get(`${this.baseURL}/api/messages/stats`);
      return { success: true, data: response.data.data };
    } catch (error: any) {
      console.error('Error getting message stats:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteMessage(messageId: string) {
    try {
      const response = await axios.delete(`${this.baseURL}/api/messages/${messageId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Error deleting message:', error);
      return { success: false, error: error.message };
    }
  }

  // =================== GPT ===================

  async generateGPTResponse(payload: GPTRequest) {
    try {
      const response = await axios.post(`${this.baseURL}/api/gpt/generate-response`, payload);
      return { success: true, data: response.data.data };
    } catch (error: any) {
      console.error('Error generating GPT response:', error);
      return { success: false, error: error.message };
    }
  }

  async analyzeMessageIntent(message: string) {
    try {
      const response = await axios.post(`${this.baseURL}/api/gpt/analyze-intent`, { message });
      return { success: true, data: response.data.data };
    } catch (error: any) {
      console.error('Error analyzing intent:', error);
      return { success: false, error: error.message };
    }
  }

  async generateSpecificResponse(type: string, data: any) {
    try {
      const response = await axios.post(`${this.baseURL}/api/gpt/generate-specific-response`, { type, data });
      return { success: true, data: response.data.data };
    } catch (error: any) {
      console.error('Error generating specific response:', error);
      return { success: false, error: error.message };
    }
  }

  async enhanceMessage(message: string, improvements: string[] = []) {
    try {
      const response = await axios.post(`${this.baseURL}/api/gpt/enhance-message`, { message, improvements });
      return { success: true, data: response.data.data };
    } catch (error: any) {
      console.error('Error enhancing message:', error);
      return { success: false, error: error.message };
    }
  }

  async generateConversationSummary(messages: any[]) {
    try {
      const response = await axios.post(`${this.baseURL}/api/gpt/generate-summary`, { messages });
      return { success: true, data: response.data.data };
    } catch (error: any) {
      console.error('Error generating summary:', error);
      return { success: false, error: error.message };
    }
  }

  async processMultipleMessages(messages: any[]) {
    try {
      const response = await axios.post(`${this.baseURL}/api/gpt/process-multiple-messages`, { messages });
      return { success: true, data: response.data.data };
    } catch (error: any) {
      console.error('Error processing multiple messages:', error);
      return { success: false, error: error.message };
    }
  }

  async generateSuggestions(message: string, clientContext?: any, count: number = 3) {
    try {
      const response = await axios.post(`${this.baseURL}/api/gpt/generate-suggestions`, { 
        message, 
        clientContext, 
        count 
      });
      return { success: true, data: response.data.data };
    } catch (error: any) {
      console.error('Error generating suggestions:', error);
      return { success: false, error: error.message };
    }
  }

  // =================== SESIONES WPP ===================

  async getSessionStatus() {
    try {
      const response = await axios.get(`${this.baseURL}/api/sessions/status`);
      return { success: true, data: response.data.data };
    } catch (error: any) {
      console.error('Error getting session status:', error);
      return { success: false, error: error.message };
    }
  }

  async startSession() {
    try {
      const response = await axios.post(`${this.baseURL}/api/sessions/start`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Error starting session:', error);
      return { success: false, error: error.message };
    }
  }

  async getQRCode() {
    try {
      const response = await axios.get(`${this.baseURL}/api/sessions/qr`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Error getting QR code:', error);
      return { success: false, error: error.message };
    }
  }

  async closeSession() {
    try {
      const response = await axios.post(`${this.baseURL}/api/sessions/close`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Error closing session:', error);
      return { success: false, error: error.message };
    }
  }

  async restartSession() {
    try {
      const response = await axios.post(`${this.baseURL}/api/sessions/restart`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Error restarting session:', error);
      return { success: false, error: error.message };
    }
  }

  // =================== WORKFLOWS ===================

  async triggerReminderWorkflow(clientIds: number[], messageTemplate: string, scheduleFor?: string) {
    try {
      const response = await axios.post(`${this.baseURL}/api/workflows/trigger/reminder`, {
        clientIds,
        messageTemplate,
        scheduleFor
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Error triggering reminder workflow:', error);
      return { success: false, error: error.message };
    }
  }

  async triggerAutoResponseWorkflow(phone: string, message: string, clientContext?: any) {
    try {
      const response = await axios.post(`${this.baseURL}/api/workflows/trigger/auto-response`, {
        phone,
        message,
        clientContext
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Error triggering auto-response workflow:', error);
      return { success: false, error: error.message };
    }
  }

  // =================== UTILIDADES ===================

  formatPhoneNumber(phone: string): string {
    // Limpiar el número
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // Si no empieza con código de país, agregar 51 (Perú)
    if (!cleaned.startsWith('+51') && !cleaned.startsWith('51') && cleaned.length === 9) {
      cleaned = '51' + cleaned;
    }
    
    // Remover + si existe
    cleaned = cleaned.replace('+', '');
    
    return cleaned;
  }

  extractCleanNumber(phone: string): string {
    return phone.replace('@c.us', '').replace(/[^\d]/g, '');
  }

  validateMessage(message: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!message || message.trim().length === 0) {
      errors.push('El mensaje no puede estar vacío');
    }
    
    if (message.length > 4096) {
      errors.push('El mensaje es demasiado largo (máximo 4096 caracteres)');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validatePhoneNumber(phone: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const cleaned = this.formatPhoneNumber(phone);
    
    if (!cleaned) {
      errors.push('Número de teléfono requerido');
    } else if (cleaned.length < 8 || cleaned.length > 15) {
      errors.push('Número de teléfono inválido');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Personalizar mensaje con variables
  personalizeMessage(template: string, variables: Record<string, string>): string {
    let personalizedMessage = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      personalizedMessage = personalizedMessage.replace(regex, value);
    });
    
    return personalizedMessage;
  }

  // Extraer variables de un template
  extractVariables(template: string): string[] {
    const matches = template.match(/\{(\w+)\}/g);
    return matches ? matches.map(match => match.slice(1, -1)) : [];
  }

  // Formatear tiempo
  formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Hoy';
    } else if (diffInDays === 1) {
      return 'Ayer';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString('es-ES', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit',
        year: diffInDays > 365 ? 'numeric' : undefined
      });
    }
  }

  // Calcular estadísticas de conversación
  calculateConversationStats(messages: any[]) {
    const stats = {
      totalMessages: messages.length,
      sentByMe: messages.filter(m => m.fromMe).length,
      receivedFromContact: messages.filter(m => !m.fromMe).length,
      averageResponseTime: 0,
      lastActivity: messages.length > 0 ? Math.max(...messages.map(m => m.timestamp)) : 0
    };
    
    stats.averageResponseTime = this.calculateAverageResponseTime(messages);
    
    return stats;
  }

  private calculateAverageResponseTime(messages: any[]): number {
    const responseTimes: number[] = [];
    
    for (let i = 1; i < messages.length; i++) {
      const current = messages[i];
      const previous = messages[i - 1];
      
      // Si el mensaje actual es mío y el anterior no
      if (current.fromMe && !previous.fromMe) {
        const responseTime = current.timestamp - previous.timestamp;
        responseTimes.push(responseTime);
      }
    }
    
    if (responseTimes.length === 0) return 0;
    
    const averageMs = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    return Math.floor(averageMs / 1000); // Convertir a segundos
  }

  // Detectar tipo de archivo por extensión
  detectFileType(filename: string): 'image' | 'document' | 'audio' | 'video' | 'unknown' {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
    const documentExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
    const audioExts = ['mp3', 'wav', 'ogg', 'aac', 'm4a'];
    const videoExts = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];
    
    if (extension && imageExts.includes(extension)) return 'image';
    if (extension && documentExts.includes(extension)) return 'document';
    if (extension && audioExts.includes(extension)) return 'audio';
    if (extension && videoExts.includes(extension)) return 'video';
    
    return 'unknown';
  }

  // Generar ID único para mensajes
  generateMessageId(): string {
    return `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }

  // Limpiar y sanitizar texto
  sanitizeMessage(message: string): string {
    return message
      .trim()
      .replace(/\s+/g, ' ') // Múltiples espacios a uno solo
      .slice(0, 4096); // Limitar longitud
  }
}

// Exportar instancia singleton
export const messagingAPI = new MessagingAPI();
export default messagingAPI;

// =================== React Hook personalizado ===================

import { useState, useEffect, useCallback } from 'react';

export interface UseMessagingOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableNotifications?: boolean;
}

export function useMessaging(options: UseMessagingOptions = {}) {
  const {
    autoRefresh = true,
    refreshInterval = 5000,
    enableNotifications = false
  } = options;

  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<any>(null);

  // Cargar mensajes
  const loadMessages = useCallback(async () => {
    try {
      const result = await messagingAPI.getMessageHistory();
      if (result.success) {
        setMessages(result.data.messages || []);
        setError(null);
      } else {
        setError(result.error || 'Error loading messages');
      }
    } catch (error: any) {
      setError(error.message);
    }
  }, []);

  // Cargar estado de sesión
  const loadSessionStatus = useCallback(async () => {
    try {
      const result = await messagingAPI.getSessionStatus();
      if (result.success) {
        setSessionStatus(result.data);
      }
    } catch (error: any) {
      console.error('Error loading session status:', error);
    }
  }, []);

  // Enviar mensaje
  const sendMessage = useCallback(async (phone: string, message: string) => {
    try {
      const result = await messagingAPI.sendMessage({ phone, message });
      if (result.success) {
        await loadMessages(); // Recargar mensajes
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [loadMessages]);

  // Enviar archivo
  const sendFile = useCallback(async (phone: string, file: File, caption?: string) => {
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const result = await messagingAPI.sendFile({
        phone,
        file: base64.split(',')[1],
        filename: file.name,
        caption
      });

      if (result.success) {
        await loadMessages();
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [loadMessages]);

  // Generar respuesta GPT
  const generateGPTResponse = useCallback(async (message: string, clientContext?: any) => {
    try {
      const result = await messagingAPI.generateGPTResponse({ message, clientContext });
      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  // Inicialización
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadMessages(), loadSessionStatus()]);
      setLoading(false);
    };

    init();
  }, [loadMessages, loadSessionStatus]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadMessages();
      loadSessionStatus();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadMessages, loadSessionStatus]);

  // Notificaciones (si están habilitadas)
  useEffect(() => {
    if (!enableNotifications || !('Notification' in window)) return;

    // Solicitar permisos de notificación
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Detectar nuevos mensajes
    const lastMessageCount = messages.length;
    const newMessages = messages.slice(lastMessageCount);

    newMessages.forEach(message => {
      if (!message.fromMe && Notification.permission === 'granted') {
        new Notification(`Nuevo mensaje de ${message.from}`, {
          body: message.message,
          icon: '/icon-192x192.png'
        });
      }
    });
  }, [messages, enableNotifications]);

  return {
    // Estados
    conversations,
    messages,
    loading,
    error,
    sessionStatus,
    
    // Acciones
    sendMessage,
    sendFile,
    generateGPTResponse,
    loadMessages,
    loadSessionStatus,
    
    // Utilidades
    api: messagingAPI
  };
}