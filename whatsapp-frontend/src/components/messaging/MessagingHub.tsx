// src/components/messaging/MessagingHub.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Send, Users, Clock, Search, Filter,
  FileText, Image, Paperclip, Smile, MoreVertical,
  CheckCircle, AlertCircle, Eye, Calendar, Zap,
  Phone, Video, Info, Bot, Settings, Mic, Camera,
  Download, Upload, Plus, Trash2, Edit, Copy,
  PlayCircle, PauseCircle, RotateCcw, Loader, BarChart3
} from 'lucide-react';
import api from '@/lib/api';
import { WhatsAppMessage, Client } from '@/types/whatsapp';

// Interfaces
interface Conversation {
  id: string;
  contactName: string;
  contactPhone: string;
  avatar?: string;
  lastMessage: WhatsAppMessage;
  unreadCount: number;
  isOnline: boolean;
  messages: WhatsAppMessage[];
}

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  variables: string[];
  usageCount: number;
}

interface MessagingStats {
  totalMessages: number;
  todayMessages: number;
  pendingMessages: number;
  activeChats: number;
  responseRate: number;
  avgResponseTime: number;
}

export function MessagingHub() {
  // Estados principales
  const [activeTab, setActiveTab] = useState<'chat' | 'bulk' | 'templates' | 'analytics'>('chat');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [stats, setStats] = useState<MessagingStats | null>(null);
  
  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showGPTSuggestions, setShowGPTSuggestions] = useState(false);
  const [gptSuggestions, setGPTSuggestions] = useState<string[]>([]);
  
  // Estados para envío masivo
  const [bulkRecipients, setBulkRecipients] = useState<string[]>([]);
  const [bulkMessage, setBulkMessage] = useState('');
  const [bulkDelay, setBulkDelay] = useState(2000);
  const [selectedClients, setSelectedClients] = useState<number[]>([]);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
    
    // Polling cada 5 segundos para mensajes nuevos
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll al final de mensajes
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const [messagesData, clientsData, statsData] = await Promise.all([
        api.messages.getHistory(),
        api.clients.getAll(),
        api.messages.getStats()
      ]);
      
      setMessages(messagesData);
      setClients(clientsData);
      setConversations(buildConversations(messagesData, clientsData));
      setStats({
        totalMessages: messagesData.length,
        todayMessages: statsData.today || 0,
        pendingMessages: messagesData.filter(m => m.status === 'sent').length,
        activeChats: new Set(messagesData.map(m => m.fromMe ? m.to : m.from)).size,
        responseRate: 85,
        avgResponseTime: 45
      });
      
      loadTemplates();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const messagesData = await api.messages.getHistory();
      setMessages(messagesData);
      setConversations(buildConversations(messagesData, clients));
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const buildConversations = (messages: WhatsAppMessage[], clients: Client[]): Conversation[] => {
    const conversationMap = new Map<string, Conversation>();
    
    messages.forEach(msg => {
      const contactId = msg.fromMe ? msg.to : msg.from;
      const cleanPhone = contactId.replace('@c.us', '');
      const client = clients.find(c => c.phone === cleanPhone);
      
      if (!conversationMap.has(contactId)) {
        conversationMap.set(contactId, {
          id: contactId,
          contactName: client?.name || cleanPhone,
          contactPhone: cleanPhone,
          lastMessage: msg,
          unreadCount: 0,
          isOnline: Math.random() > 0.5, // Simulado
          messages: []
        });
      }
      
      const conversation = conversationMap.get(contactId)!;
      conversation.messages.push(msg);
      
      // Actualizar último mensaje si es más reciente
      if (msg.timestamp > conversation.lastMessage.timestamp) {
        conversation.lastMessage = msg;
      }
      
      // Contar mensajes no leídos
      if (!msg.fromMe && msg.status !== 'read') {
        conversation.unreadCount++;
      }
    });
    
    return Array.from(conversationMap.values())
      .sort((a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp);
  };

  const loadTemplates = () => {
    // Templates simulados - en tu backend puedes crear un endpoint para esto
    setTemplates([
      {
        id: '1',
        name: 'Saludo inicial',
        content: '¡Hola {name}! 👋 Gracias por contactarnos. ¿En qué podemos ayudarte?',
        category: 'Saludos',
        variables: ['name'],
        usageCount: 150
      },
      {
        id: '2',
        name: 'Info de precios',
        content: 'Te envío nuestros precios:\n\n📺 Netflix Premium: S/25\n🏰 Disney+: S/20\n📦 Prime Video: S/15\n\n¿Cuál te interesa?',
        category: 'Ventas',
        variables: [],
        usageCount: 89
      },
      {
        id: '3',
        name: 'Recordatorio de pago',
        content: 'Hola {name}, tu suscripción de {service} vence el {expiry}. ¿Necesitas renovar?',
        category: 'Recordatorios',
        variables: ['name', 'service', 'expiry'],
        usageCount: 234
      }
    ]);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;
    
    setSending(true);
    try {
      await api.messages.send({
        phone: selectedConversation.replace('@c.us', ''),
        message: newMessage.trim()
      });
      
      setNewMessage('');
      await loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedConversation) return;

    try {
      setSending(true);
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        // Usar el endpoint de envío de archivos
        await fetch(`http://localhost:3001/api/messages/send-file`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: selectedConversation.replace('@c.us', ''),
            file: base64.split(',')[1],
            filename: file.name,
            caption: ''
          })
        });
        
        await loadMessages();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setSending(false);
    }
  };

  const generateGPTSuggestions = async () => {
    if (!selectedConversation) return;
    
    try {
      setShowGPTSuggestions(true);
      const conversation = conversations.find(c => c.id === selectedConversation);
      const lastMessage = conversation?.messages.slice(-1)[0];
      
      if (lastMessage && !lastMessage.fromMe) {
        const client = clients.find(c => c.phone === conversation?.contactPhone);
        const response = await api.gpt.generateResponse(lastMessage.message, client);
        setGPTSuggestions([response.data.response]);
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
    }
  };

  const handleBulkSend = async () => {
    if (!bulkMessage.trim() || selectedClients.length === 0) {
      alert('Selecciona destinatarios y escribe un mensaje');
      return;
    }

    try {
      setSending(true);
      const phones = selectedClients.map(id => {
        const client = clients.find(c => c.id === id);
        return client?.phone || '';
      }).filter(Boolean);

      await fetch('http://localhost:3001/api/messages/send-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phones,
          message: bulkMessage,
          delay: bulkDelay
        })
      });

      setBulkMessage('');
      setSelectedClients([]);
      alert(`Mensaje enviado a ${phones.length} destinatarios`);
    } catch (error) {
      console.error('Error sending bulk message:', error);
      alert('Error al enviar mensajes masivos');
    } finally {
      setSending(false);
    }
  };

  const personalizeTemplate = (template: string, client?: Client) => {
    if (!client) return template;
    
    return template
      .replace(/\{name\}/g, client.name)
      .replace(/\{service\}/g, client.service)
      .replace(/\{expiry\}/g, client.expiry)
      .replace(/\{phone\}/g, client.phone);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredConversations = conversations.filter(conv =>
    conv.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.contactPhone.includes(searchTerm)
  );

  const currentConversation = conversations.find(c => c.id === selectedConversation);
  const currentClient = clients.find(c => c.phone === currentConversation?.contactPhone);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <MessageSquare className="w-6 h-6 mr-2 text-blue-600" />
              Centro de Mensajería
            </h1>
            <p className="text-gray-600 mt-1">
              Gestiona todas tus conversaciones de WhatsApp
            </p>
          </div>
          
          {stats && (
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
                <p className="text-2xl font-bold text-yellow-600">{stats.activeChats}</p>
                <p className="text-xs text-gray-600">Chats</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{stats.responseRate}%</p>
                <p className="text-xs text-gray-600">Respuesta</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'chat', label: 'Conversaciones', icon: MessageSquare },
            { id: 'bulk', label: 'Envío Masivo', icon: Users },
            { id: 'templates', label: 'Plantillas', icon: FileText },
            { id: 'analytics', label: 'Analíticas', icon: BarChart3 }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && (
          <div className="h-full flex">
            {/* Sidebar - Lista de conversaciones */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col bg-white">
              {/* Search */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar conversaciones..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Conversaciones */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                    <MessageSquare className="w-8 h-8 mb-2" />
                    <p>No hay conversaciones</p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation.id)}
                      className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                        selectedConversation === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium mr-3">
                          {conversation.contactName.charAt(0).toUpperCase()}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                          conversation.isOnline ? 'bg-green-400' : 'bg-gray-400'
                        }`}></div>
                      </div>

                      {/* Info */}
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
                            {conversation.lastMessage.fromMe && (
                              <div className="text-gray-400">
                                {conversation.lastMessage.status === 'sent' && '✓'}
                                {conversation.lastMessage.status === 'delivered' && '✓✓'}
                                {conversation.lastMessage.status === 'read' && <span className="text-blue-500">✓✓</span>}
                              </div>
                            )}
                            <p className="text-sm text-gray-600 truncate">
                              {conversation.lastMessage.message}
                            </p>
                          </div>
                          
                          {conversation.unreadCount > 0 && (
                            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 ml-2 min-w-[1.25rem] h-5 flex items-center justify-center">
                              {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat View */}
            <div className="flex-1 flex flex-col">
              {selectedConversation && currentConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                        {currentConversation.contactName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="font-medium text-gray-900">{currentConversation.contactName}</h2>
                        <div className="flex items-center space-x-2">
                          <p className="text-sm text-gray-500">{currentConversation.contactPhone}</p>
                          {currentClient && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                              {currentClient.service}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={generateGPTSuggestions}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Generar respuesta con IA"
                      >
                        <Bot className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Phone className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Video className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Info className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                    {currentConversation.messages
                      .sort((a, b) => a.timestamp - b.timestamp)
                      .map((message) => (
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
                                {formatTime(message.timestamp)}
                              </span>
                              {message.fromMe && (
                                <div className={`${
                                  message.status === 'read' ? 'text-green-300' : 
                                  message.status === 'delivered' ? 'text-blue-200' : 
                                  'text-blue-100'
                                }`}>
                                  {message.status === 'sent' && '✓'}
                                  {message.status === 'delivered' && '✓✓'}
                                  {message.status === 'read' && '✓✓'}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* GPT Suggestions */}
                  {showGPTSuggestions && gptSuggestions.length > 0 && (
                    <div className="bg-yellow-50 border-t border-yellow-200 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-yellow-800 flex items-center">
                          <Bot className="w-4 h-4 mr-1" />
                          Sugerencia de IA
                        </span>
                        <button
                          onClick={() => setShowGPTSuggestions(false)}
                          className="text-yellow-600 hover:text-yellow-800"
                        >
                          ×
                        </button>
                      </div>
                      {gptSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          onClick={() => setNewMessage(suggestion)}
                          className="text-sm text-yellow-800 bg-yellow-100 p-2 rounded cursor-pointer hover:bg-yellow-200 transition-colors"
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Input Area */}
                  <div className="bg-white border-t border-gray-200 p-4">
                    <div className="flex items-end space-x-2">
                      {/* File upload */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                        accept="image/*,document/*,audio/*"
                      />
                      
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Adjuntar archivo"
                      >
                        <Paperclip className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() => setShowTemplates(!showTemplates)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Plantillas"
                      >
                        <FileText className="w-5 h-5" />
                      </button>

                      <div className="flex-1 relative">
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          placeholder="Escribe un mensaje..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={2}
                        />
                        
                        {/* Templates Dropdown */}
                        {showTemplates && (
                          <div className="absolute bottom-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mb-2 max-h-48 overflow-y-auto">
                            {templates.map((template) => (
                              <button
                                key={template.id}
                                onClick={() => {
                                  const personalizedTemplate = personalizeTemplate(template.content, currentClient);
                                  setNewMessage(personalizedTemplate);
                                  setShowTemplates(false);
                                }}
                                className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-medium text-sm text-gray-900">{template.name}</div>
                                <div className="text-xs text-gray-600 mt-1 truncate">{template.content}</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Smile className="w-5 h-5" />
                      </button>

                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
                      >
                        {sending ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        <span>Enviar</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                // Empty state
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      Selecciona una conversación
                    </h3>
                    <p className="text-gray-600">
                      Elige un chat de la lista para comenzar a conversar
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'bulk' && (
          <div className="h-full flex">
            {/* Bulk Messaging Interface */}
            <div className="w-2/3 p-6 overflow-y-auto">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Envío Masivo</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Destinatarios seleccionados: {selectedClients.length}
                      </label>
                      <div className="text-sm text-gray-600">
                        {selectedClients.map(id => {
                          const client = clients.find(c => c.id === id);
                          return client?.name;
                        }).join(', ')}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mensaje
                      </label>
                      <textarea
                        value={bulkMessage}
                        onChange={(e) => setBulkMessage(e.target.value)}
                        placeholder="Escribe tu mensaje aquí... Usa {name}, {service}, {expiry} para personalizar"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={4}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {bulkMessage.length}/1000 caracteres
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delay entre mensajes (ms)
                      </label>
                      <input
                        type="number"
                        value={bulkDelay}
                        onChange={(e) => setBulkDelay(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min={1000}
                        max={10000}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Recomendado: 2000ms para evitar bloqueos
                      </p>
                    </div>

                    <button
                      onClick={handleBulkSend}
                      disabled={!bulkMessage.trim() || selectedClients.length === 0 || sending}
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {sending ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                      <span>Enviar a {selectedClients.length} destinatarios</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Selection Sidebar */}
            <div className="w-1/3 border-l border-gray-200 bg-white">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900">Seleccionar Destinatarios</h3>
              </div>
              <div className="h-full overflow-y-auto">
                <div className="p-4 space-y-2">
                  <button
                    onClick={() => {
                      if (selectedClients.length === clients.length) {
                        setSelectedClients([]);
                      } else {
                        setSelectedClients(clients.map(c => c.id));
                      }
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {selectedClients.length === clients.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                  </button>
                  
                  {clients.map((client) => (
                    <label
                      key={client.id}
                      className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedClients.includes(client.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedClients([...selectedClients, client.id]);
                          } else {
                            setSelectedClients(selectedClients.filter(id => id !== client.id));
                          }
                        }}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{client.name}</div>
                        <div className="text-xs text-gray-600">{client.service}</div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {client.status === 'active' && '🟢'}
                        {client.status === 'expiring' && '🟡'}
                        {client.status === 'expired' && '🔴'}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Plantillas de Mensajes</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Nueva Plantilla</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <div key={template.id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-600">{template.category}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <Copy className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-3 line-clamp-3">{template.content}</p>
                    
                    {template.variables.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Variables:</p>
                        <div className="flex flex-wrap gap-1">
                          {template.variables.map((variable) => (
                            <span key={variable} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {`{${variable}}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Usado {template.usageCount} veces</span>
                      <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                        Usar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Analíticas de Mensajería</h2>
              
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <MessageSquare className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Mensajes</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Clock className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Tiempo Respuesta</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.avgResponseTime}s</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Users className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Chats Activos</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.activeChats}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Zap className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Tasa Respuesta</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.responseRate}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Actividad por Hora</h3>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Gráfico de actividad por implementar
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}