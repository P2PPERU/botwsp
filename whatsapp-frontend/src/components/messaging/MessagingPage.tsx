// src/components/messaging/MessagingPage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare, Send, Users, Clock, Search, Filter,
  FileText, Image, Paperclip, Smile, MoreVertical,
  CheckCircle, AlertCircle, Eye, Calendar, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { MessageComposer } from './MessageComposer';
import { ConversationsList } from './ConversationsList';
import { ChatView } from './ChatView';
import { BulkMessaging } from './BulkMessaging';
import { MessageTemplates } from './MessageTemplates';
import { ScheduledMessages } from './ScheduledMessages';
import api from '@/lib/api';
import { WhatsAppMessage, Client } from '@/types/whatsapp';

export function MessagingPage() {
  const [activeTab, setActiveTab] = useState<'chat' | 'bulk' | 'templates' | 'scheduled'>('chat');
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para estadísticas
  const [stats, setStats] = useState({
    totalMessages: 0,
    todayMessages: 0,
    pendingMessages: 0,
    activeChats: 0
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [messagesData, clientsData, statsData] = await Promise.all([
        api.messages.getHistory(),
        api.clients.getAll(),
        api.messages.getStats()
      ]);
      
      setMessages(messagesData);
      setClients(clientsData);
      setStats({
        totalMessages: messagesData.length,
        todayMessages: statsData.today || 0,
        pendingMessages: messagesData.filter(m => m.status === 'sent').length,
        activeChats: new Set(messagesData.map(m => m.fromMe ? m.to : m.from)).size
      });
    } catch (error) {
      console.error('Error loading messaging data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (phone: string, message: string, type: 'text' | 'file' = 'text', fileData?: any) => {
    try {
      await api.messages.send({ phone, message, type, ...fileData });
      await loadData(); // Recargar mensajes
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const getConversations = () => {
    const conversationMap = new Map();
    
    messages.forEach(msg => {
      const contactId = msg.fromMe ? msg.to : msg.from;
      const existing = conversationMap.get(contactId);
      
      if (!existing || msg.timestamp > existing.lastMessage.timestamp) {
        conversationMap.set(contactId, {
          contactId,
          contactName: getContactName(contactId),
          lastMessage: msg,
          unreadCount: !msg.fromMe && msg.status !== 'read' ? 1 : 0,
          messages: messages.filter(m => 
            (m.from === contactId && m.to !== contactId) || 
            (m.to === contactId && m.from !== contactId)
          )
        });
      }
    });
    
    return Array.from(conversationMap.values())
      .sort((a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp);
  };

  const getContactName = (phone: string) => {
    const client = clients.find(c => c.phone === phone || c.phone === phone.replace('@c.us', ''));
    return client?.name || phone.replace('@c.us', '');
  };

  const filteredMessages = messages.filter(msg =>
    msg.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getContactName(msg.fromMe ? msg.to : msg.from).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    { id: 'chat', label: 'Conversaciones', icon: MessageSquare },
    { id: 'bulk', label: 'Envío Masivo', icon: Users },
    { id: 'templates', label: 'Plantillas', icon: FileText },
    { id: 'scheduled', label: 'Programados', icon: Calendar }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <MessageSquare className="w-6 h-6 mr-2" />
              Centro de Mensajería
            </h1>
            <p className="text-gray-600 mt-1">
              Gestiona todas tus conversaciones y envíos
            </p>
          </div>
          
          {/* Estadísticas rápidas */}
          <div className="flex space-x-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.totalMessages}</p>
              <p className="text-xs text-gray-600">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.todayMessages}</p>
              <p className="text-xs text-gray-600">Hoy</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingMessages}</p>
              <p className="text-xs text-gray-600">Pendientes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.activeChats}</p>
              <p className="text-xs text-gray-600">Chats</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="bg-white border-b border-gray-200">
        <nav className="flex space-x-8 px-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && (
          <div className="h-full flex">
            {/* Lista de conversaciones */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              {/* Búsqueda */}
              <div className="p-4 border-b border-gray-200">
                <Input
                  placeholder="Buscar conversaciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={<Search className="w-4 h-4 text-gray-400" />}
                />
              </div>
              
              {/* Lista */}
              <ConversationsList
                conversations={getConversations()}
                selectedConversation={selectedConversation}
                onSelectConversation={setSelectedConversation}
                loading={loading}
              />
            </div>

            {/* Vista de chat */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <ChatView
                  conversation={selectedConversation}
                  messages={messages.filter(m => 
                    (m.from === selectedConversation || m.to === selectedConversation)
                  )}
                  contactName={getContactName(selectedConversation)}
                  onSendMessage={handleSendMessage}
                  onLoadMore={() => {}} // Implementar carga de más mensajes
                />
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-xl font-medium text-gray-900">
                      Selecciona una conversación
                    </p>
                    <p className="text-gray-600 mt-2">
                      Elige un chat de la lista para comenzar a conversar
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'bulk' && (
          <BulkMessaging
            clients={clients}
            onSendBulk={async (data) => {
              // Implementar envío masivo
              console.log('Sending bulk messages:', data);
              await loadData();
            }}
          />
        )}

        {activeTab === 'templates' && (
          <MessageTemplates
            onUseTemplate={(template) => {
              // Implementar uso de plantilla
              console.log('Using template:', template);
            }}
          />
        )}

        {activeTab === 'scheduled' && (
          <ScheduledMessages
            onScheduleMessage={async (data) => {
              // Implementar programación de mensajes
              console.log('Scheduling message:', data);
            }}
          />
        )}
      </div>
    </div>
  );
}

// src/components/messaging/ConversationsList.tsx
interface Conversation {
  contactId: string;
  contactName: string;
  lastMessage: WhatsAppMessage;
  unreadCount: number;
  messages: WhatsAppMessage[];
}

interface ConversationsListProps {
  conversations: Conversation[];
  selectedConversation: string | null;
  onSelectConversation: (contactId: string) => void;
  loading: boolean;
}

export function ConversationsList({
  conversations,
  selectedConversation,
  onSelectConversation,
  loading
}: ConversationsListProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-gray-400" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'read':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const daysDiff = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      return date.toLocaleTimeString('es-PE', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (daysDiff === 1) {
      return 'Ayer';
    } else if (daysDiff < 7) {
      return date.toLocaleDateString('es-PE', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('es-PE', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-4">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
          <MessageSquare className="w-12 h-12 text-gray-400 mb-3" />
          <p className="text-gray-600">No hay conversaciones</p>
        </div>
      ) : (
        conversations.map((conversation) => (
          <div
            key={conversation.contactId}
            onClick={() => onSelectConversation(conversation.contactId)}
            className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
              selectedConversation === conversation.contactId ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
            }`}
          >
            {/* Avatar */}
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium mr-3">
              {conversation.contactName.charAt(0).toUpperCase()}
            </div>

            {/* Información de la conversación */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {conversation.contactName}
                </h3>
                <span className="text-xs text-gray-500">
                  {formatTime(conversation.lastMessage.timestamp)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1 min-w-0 flex-1">
                  {conversation.lastMessage.fromMe && getStatusIcon(conversation.lastMessage.status)}
                  <p className="text-sm text-gray-600 truncate">
                    {conversation.lastMessage.type === 'text' 
                      ? conversation.lastMessage.message 
                      : `📎 ${conversation.lastMessage.type}`
                    }
                  </p>
                </div>
                
                {conversation.unreadCount > 0 && (
                  <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 ml-2">
                    {conversation.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// src/components/messaging/ChatView.tsx
interface ChatViewProps {
  conversation: string;
  messages: WhatsAppMessage[];
  contactName: string;
  onSendMessage: (phone: string, message: string, type?: 'text' | 'file', fileData?: any) => Promise<void>;
  onLoadMore: () => void;
}

export function ChatView({
  conversation,
  messages,
  contactName,
  onSendMessage,
  onLoadMore
}: ChatViewProps) {
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await onSendMessage(conversation, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <>
      {/* Header del chat */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
            {contactName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-medium text-gray-900">{contactName}</h2>
            <p className="text-sm text-gray-500">{conversation.replace('@c.us', '')}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" icon={<Eye className="w-4 h-4" />}>
            Ver perfil
          </Button>
          <Button variant="ghost" size="sm" icon={<MoreVertical className="w-4 h-4" />} />
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="space-y-4">
          {sortedMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.fromMe
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                <p className="text-sm">{message.message}</p>
                <div className="flex items-center justify-end mt-1 space-x-1">
                  <span className={`text-xs ${message.fromMe ? 'text-blue-100' : 'text-gray-500'}`}>
                    {new Date(message.timestamp).toLocaleTimeString('es-PE', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {message.fromMe && (
                    <div className="text-blue-100">
                      {message.status === 'sent' && '✓'}
                      {message.status === 'delivered' && '✓✓'}
                      {message.status === 'read' && <span className="text-green-300">✓✓</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compositor de mensajes */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-end space-x-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<Paperclip className="w-4 h-4" />}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<Image className="w-4 h-4" />}
          />
          
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe un mensaje..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            icon={<Smile className="w-4 h-4" />}
            onClick={() => setShowEmojis(!showEmojis)}
          />
          
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            isLoading={sending}
            icon={<Send className="w-4 h-4" />}
          >
            Enviar
          </Button>
        </div>
      </div>
    </>
  );
}