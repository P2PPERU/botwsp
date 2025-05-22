// src/components/messaging/ChatView.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, MoreVertical, Phone, Video, Info, Smile, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { WhatsAppMessage } from '@/types/whatsapp';

interface ChatViewProps {
  conversationId: string;
  contactName: string;
  contactPhone: string;
  messages: WhatsAppMessage[];
  onSendMessage: (message: string) => void;
  loading?: boolean;
}

export function ChatView({ 
  conversationId, 
  contactName, 
  contactPhone, 
  messages, 
  onSendMessage,
  loading = false
}: ChatViewProps) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    
    onSendMessage(newMessage);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return '✓';
      case 'delivered': return '✓✓';
      case 'read': return '✓✓';
      case 'failed': return '✗';
      default: return '⏳';
    }
  };

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <Send className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">Selecciona una conversación</h3>
          <p>Elige una conversación de la lista para empezar a chatear</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header del chat */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
            {contactName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{contactName}</h3>
            <p className="text-sm text-gray-500">{contactPhone}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" icon={<Phone className="w-4 h-4" />} />
          <Button variant="outline" size="sm" icon={<Video className="w-4 h-4" />} />
          <Button variant="outline" size="sm" icon={<Info className="w-4 h-4" />} />
          <Button variant="outline" size="sm" icon={<MoreVertical className="w-4 h-4" />} />
        </div>
      </div>

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No hay mensajes en esta conversación</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={message.id || index}
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
                <div className={`flex items-center justify-end mt-1 space-x-1 text-xs ${
                  message.fromMe ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  <span>{formatTime(message.time)}</span>
                  {message.fromMe && (
                    <span className={`${
                      message.status === 'read' ? 'text-blue-200' : 
                      message.status === 'delivered' ? 'text-blue-200' : 
                      message.status === 'failed' ? 'text-red-300' : 'text-blue-100'
                    }`}>
                      {getStatusIcon(message.status)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de mensaje */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Button variant="outline" size="sm" icon={<Paperclip className="w-4 h-4" />} />
              <Button variant="outline" size="sm" icon={<Smile className="w-4 h-4" />} />
            </div>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe un mensaje..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            icon={<Send className="w-4 h-4" />}
          >
            Enviar
          </Button>
        </div>
      </div>
    </div>
  );
}