// src/components/messaging/MessagingPage.tsx
'use client';

import React, { useState, useEffect, useMemo, createContext, useContext, ReactNode } from 'react';
import { 
  Wifi, 
  WifiOff, 
  AlertCircle, 
  CheckCircle, 
  QrCode, 
  X, 
  RotateCcw,
  MessageSquare,
  Calendar,
  Users,
  Zap
} from 'lucide-react';
import { MessagingHub } from './MessagingHub';
import messagingAPI, { FileMessagePayload } from '@/lib/messaging-api';

// =================== Main Component ===================

export function MessagingPageComplete() {
  return <MessagingHub />;
}

// =================== Types ===================

export interface ExtendedMessage {
  id: string;
  from: string;
  to: string;
  message: string;
  time: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  type: 'text' | 'image' | 'document' | 'audio' | 'video';
  timestamp: number;
  fromMe: boolean;
  fileData?: {
    filename?: string;
    size?: number;
    mimeType?: string;
  };
  replyTo?: string;
  forwarded?: boolean;
  edited?: boolean;
  deleted?: boolean;
}

export interface ExtendedConversation {
  id: string;
  contactName: string;
  contactPhone: string;
  avatar?: string;
  lastMessage: ExtendedMessage;
  unreadCount: number;
  isOnline: boolean;
  lastSeen?: number;
  isTyping?: boolean;
  isPinned?: boolean;
  isMuted?: boolean;
  messages: ExtendedMessage[];
  labels?: string[];
  notes?: string;
}

interface QuickStatsProps {
  stats: {
    totalMessages: number;
    todayMessages: number;
    activeChats: number;
    responseRate: number;
  };
}

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MessagingContextType {
  conversations: ExtendedConversation[];
  selectedConversation: string | null;
  setSelectedConversation: (id: string | null) => void;
  sendMessage: (phone: string, message: string) => Promise<any>;
  sendFile: (phone: string, file: File, caption?: string) => Promise<any>;
  markAsRead: (messageIds: string[]) => Promise<void>;
  refreshConversations: () => Promise<void>;
}

// =================== Connection Status Component ===================

export function ConnectionStatus() {
  const [status, setStatus] = useState<{
    connected: boolean;
    session: string;
    lastCheck: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const result = await messagingAPI.getSessionStatus();
        if (result.success) {
          setStatus(result.data);
        }
      } catch (error) {
        console.error('Error checking status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000); // Cada 10 segundos

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
        <span className="text-sm">Verificando...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {status?.connected ? (
        <>
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-600 font-medium">WhatsApp Conectado</span>
        </>
      ) : (
        <>
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-600 font-medium">WhatsApp Desconectado</span>
        </>
      )}
    </div>
  );
}

// =================== QR Code Modal Component ===================

export function QRCodeModal({ isOpen, onClose }: QRCodeModalProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateQR = async () => {
    try {
      setLoading(true);
      const result = await messagingAPI.getQRCode();
      if (result.success) {
        setQrCode(result.data.qrcode || result.data);
      }
    } catch (error) {
      console.error('Error generating QR:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !qrCode) {
      generateQR();
    }
  }, [isOpen, qrCode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Conectar WhatsApp</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center">
          <div className="w-64 h-64 mx-auto mb-4 border border-gray-200 rounded-lg flex items-center justify-center">
            {loading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            ) : qrCode ? (
              <img src={qrCode} alt="QR Code" className="w-full h-full object-contain" />
            ) : (
              <QrCode className="w-16 h-16 text-gray-400" />
            )}
          </div>

          <div className="space-y-2 text-sm text-gray-600 mb-4">
            <p>1. Abre WhatsApp en tu teléfono</p>
            <p>2. Ve a Configuración {'>'}  Dispositivos vinculados</p>
            <p>3. Toca "Vincular un dispositivo"</p>
            <p>4. Escanea este código QR</p>
          </div>

          <button
            onClick={generateQR}
            disabled={loading}
            className="flex items-center space-x-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Generar nuevo QR</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// =================== Quick Stats Component ===================

export function QuickStats({ stats }: QuickStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <MessageSquare className="w-5 h-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">Total</p>
            <p className="text-xl font-bold text-gray-900">{stats.totalMessages}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 rounded-lg">
            <Calendar className="w-5 h-5 text-green-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">Hoy</p>
            <p className="text-xl font-bold text-gray-900">{stats.todayMessages}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">Chats</p>
            <p className="text-xl font-bold text-gray-900">{stats.activeChats}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Zap className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">Respuesta</p>
            <p className="text-xl font-bold text-gray-900">{stats.responseRate}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// =================== Hooks ===================

export function useMessageNotifications(messages: ExtendedMessage[]) {
  useEffect(() => {
    // Solicitar permisos de notificación
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    // Detectar nuevos mensajes entrantes
    const newIncomingMessages = messages.filter(msg => 
      !msg.fromMe && 
      Date.now() - msg.timestamp < 10000 // Últimos 10 segundos
    );

    newIncomingMessages.forEach(message => {
      const notification = new Notification(`Nuevo mensaje`, {
        body: `${message.from}: ${message.message}`,
        icon: '/favicon.ico',
        tag: message.id,
        requireInteraction: false
      });

      // Auto-cerrar después de 5 segundos
      setTimeout(() => notification.close(), 5000);

      // Manejar click en notificación
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    });
  }, [messages]);
}

export function useAdvancedSearch(conversations: ExtendedConversation[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<{
    from?: Date;
    to?: Date;
  }>({});
  const [statusFilter, setStatusFilter] = useState<string>('');

  const filteredConversations = useMemo(() => {
    return conversations.filter(conversation => {
      // Filtro por texto
      const matchesText = !searchTerm || 
        conversation.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conversation.contactPhone.includes(searchTerm) ||
        conversation.messages.some((msg: ExtendedMessage) => 
          msg.message.toLowerCase().includes(searchTerm.toLowerCase())
        );

      // Filtro por fecha
      const matchesDate = !dateFilter.from || !dateFilter.to ||
        (conversation.lastMessage.timestamp >= dateFilter.from.getTime() &&
         conversation.lastMessage.timestamp <= dateFilter.to.getTime());

      // Filtro por estado
      const matchesStatus = !statusFilter ||
        (statusFilter === 'unread' && conversation.unreadCount > 0) ||
        (statusFilter === 'read' && conversation.unreadCount === 0) ||
        (statusFilter === 'online' && conversation.isOnline) ||
        (statusFilter === 'offline' && !conversation.isOnline);

      return matchesText && matchesDate && matchesStatus;
    });
  }, [conversations, searchTerm, dateFilter, statusFilter]);

  return {
    searchTerm,
    setSearchTerm,
    dateFilter,
    setDateFilter,
    statusFilter,
    setStatusFilter,
    filteredConversations
  };
}

// =================== Utility Functions ===================

export function exportConversationToCSV(conversation: ExtendedConversation, messages: ExtendedMessage[]) {
  const csvContent = [
    ['Timestamp', 'From', 'To', 'Message', 'Status', 'Type'],
    ...messages.map(msg => [
      new Date(msg.timestamp).toISOString(),
      msg.fromMe ? 'You' : conversation.contactName,
      msg.fromMe ? conversation.contactName : 'You',
      msg.message,
      msg.status,
      msg.type
    ])
  ].map(row => row.join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `conversation_${conversation.contactName}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportAllConversationsToJSON(conversations: ExtendedConversation[]) {
  const data = {
    exportDate: new Date().toISOString(),
    totalConversations: conversations.length,
    conversations: conversations.map(conv => ({
      id: conv.id,
      contactName: conv.contactName,
      contactPhone: conv.contactPhone,
      totalMessages: conv.messages.length,
      lastActivity: new Date(conv.lastMessage.timestamp).toISOString(),
      messages: conv.messages.map(msg => ({
        id: msg.id,
        timestamp: new Date(msg.timestamp).toISOString(),
        message: msg.message,
        fromMe: msg.fromMe,
        status: msg.status,
        type: msg.type
      }))
    }))
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `whatsapp_conversations_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// =================== Context Provider ===================

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export function MessagingProvider({ children }: { children: ReactNode }) {
  // Note: You'll need to implement useMessaging hook or replace with your actual hook
  // const messagingHook = useMessaging({
  //   autoRefresh: true,
  //   refreshInterval: 5000,
  //   enableNotifications: true
  // });

  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ExtendedConversation[]>([]);

  // Implementaciones correctas según tu API real
  const sendMessage = async (phone: string, message: string): Promise<any> => {
    return messagingAPI.sendMessage({ 
      phone, 
      message 
    });
  };

  const sendFile = async (phone: string, file: File, caption?: string): Promise<any> => {
    try {
      // Convertir File a base64 como espera tu API
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remover el prefijo "data:tipo/mime;base64," para obtener solo el base64
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Usar los tipos correctos para FileMessagePayload
      const filePayload: FileMessagePayload = {
        phone,
        file: base64, // string base64, no File
        filename: file.name,
        caption: caption || ''
      };
      
      return messagingAPI.sendFile(filePayload);
    } catch (error) {
      console.error('Error converting file to base64:', error);
      throw error;
    }
  };

  const markAsRead = async (messageIds: string[]): Promise<void> => {
    if (messagingAPI.markMessagesAsRead) {
      await messagingAPI.markMessagesAsRead(messageIds);
    }
    await refreshConversations();
  };

  const refreshConversations = async (): Promise<void> => {
    try {
      // Usar el método correcto que existe en tu API
      const result = await messagingAPI.getMessageHistory();
      
      if (result.success) {
        // Convertir mensajes a conversaciones si es necesario
        // o actualizar el estado según la estructura de datos que devuelve tu API
        const messages = result.data || [];
        
        // Aquí puedes procesar los mensajes para convertirlos en conversaciones
        // Por ejemplo, agrupar por número de teléfono
        const conversationsMap = new Map();
        
        messages.forEach((msg: any) => {
          const contactKey = msg.fromMe ? msg.to : msg.from;
          if (!conversationsMap.has(contactKey)) {
            conversationsMap.set(contactKey, {
              id: contactKey,
              contactName: contactKey,
              contactPhone: contactKey,
              messages: [],
              lastMessage: msg,
              unreadCount: 0,
              isOnline: false
            });
          }
          conversationsMap.get(contactKey).messages.push(msg);
        });
        
        setConversations(Array.from(conversationsMap.values()));
      }
    } catch (error) {
      console.error('Error refreshing conversations:', error);
    }
  };

  const value: MessagingContextType = {
    conversations,
    selectedConversation,
    setSelectedConversation,
    sendMessage,
    sendFile,
    markAsRead,
    refreshConversations
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessagingContext() {
  const context = useContext(MessagingContext);
  if (context === undefined) {
    throw new Error('useMessagingContext must be used within a MessagingProvider');
  }
  return context;
}

// =================== Integration Example ===================

/*
// src/app/page.tsx - Example of how to integrate this component

const renderContent = () => {
  switch (activeTab) {
    case 'dashboard': 
      return <DashboardContent />;
    case 'messages': 
      return <MessagingPageComplete />;
    case 'clients': 
      return <ClientsPage onSendMessage={(phone: string, name: string) => {
        console.log('Enviar mensaje a:', phone, name);
        setActiveTab('messages');
      }} />;
    case 'workflows': 
      return <div className="p-8 text-center text-gray-500">Módulo de workflows en desarrollo</div>;
    case 'settings': 
      return <div className="p-8 text-center text-gray-500">Configuración en desarrollo</div>;
    default: 
      return <DashboardContent />;
  }
};
*/