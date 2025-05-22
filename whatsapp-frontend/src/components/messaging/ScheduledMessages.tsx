// src/components/messaging/ScheduledMessages.tsx
import React, { useState } from 'react';
import { Calendar, Clock, Send, Trash2, Edit, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface ScheduledMessage {
  id: string;
  recipient: string;
  recipientName: string;
  message: string;
  scheduledDate: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  createdAt: string;
  sentAt?: string;
  error?: string;
}

interface ScheduledMessagesProps {
  onScheduleMessage: (data: {
    recipients: string[];
    message: string;
    scheduleFor: Date;
  }) => Promise<void>;
}

export function ScheduledMessages({ onScheduleMessage }: ScheduledMessagesProps) {
  const [messages] = useState([
    {
      id: '1',
      recipient: '51987654321',
      recipientName: 'Juan Pérez',
      message: 'Recordatorio: Tu suscripción vence mañana',
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending' as const,
      createdAt: new Date().toISOString()
    }
  ]);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const filteredMessages = messages.filter(message => 
    !statusFilter || message.status === statusFilter
  );

  const getStatusInfo = (status: string) => {
    const configs = {
      pending: { color: 'warning', label: 'Pendiente', icon: Clock },
      sent: { color: 'success', label: 'Enviado', icon: Send },
      failed: { color: 'danger', label: 'Fallido', icon: Trash2 },
      cancelled: { color: 'default', label: 'Cancelado', icon: Pause }
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isScheduledInPast = (scheduledDate: string) => {
    return new Date(scheduledDate) < new Date();
  };

  const groupMessagesByDate = (messages: ScheduledMessage[]) => {
    const groups: { [key: string]: ScheduledMessage[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.scheduledDate).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return groups;
  };

  const groupedMessages = groupMessagesByDate(filteredMessages);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Mensajes Programados</h2>
          <p className="text-gray-600">Gestiona tus mensajes programados para envío automático</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="sent">Enviados</option>
            <option value="failed">Fallidos</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { status: 'pending', label: 'Pendientes', count: messages.filter(m => m.status === 'pending').length },
          { status: 'sent', label: 'Enviados', count: messages.filter(m => m.status === 'sent').length },
          { status: 'failed', label: 'Fallidos', count: messages.filter(m => m.status === 'failed').length },
          { status: 'cancelled', label: 'Cancelados', count: messages.filter(m => m.status === 'cancelled').length }
        ].map((stat) => {
          const statusInfo = getStatusInfo(stat.status);
          const StatusIcon = statusInfo.icon;
          
          return (
            <div key={stat.status} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg bg-${statusInfo.color === 'success' ? 'green' : statusInfo.color === 'warning' ? 'yellow' : statusInfo.color === 'danger' ? 'red' : 'gray'}-100`}>
                  <StatusIcon className={`w-5 h-5 text-${statusInfo.color === 'success' ? 'green' : statusInfo.color === 'warning' ? 'yellow' : statusInfo.color === 'danger' ? 'red' : 'gray'}-600`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lista de mensajes programados */}
      <div className="space-y-4">
        {Object.keys(groupedMessages).length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay mensajes programados</h3>
            <p className="text-gray-500">Los mensajes que programes aparecerán aquí</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="font-medium text-gray-900">
                  {new Date(date).toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
              </div>
              
              <div className="divide-y divide-gray-100">
                {msgs.map((message) => {
                  const statusInfo = getStatusInfo(message.status);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <div key={message.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="flex items-center space-x-2">
                              <StatusIcon className="w-4 h-4 text-gray-500" />
                              <span className="font-medium text-gray-900">{message.recipientName}</span>
                              <span className="text-sm text-gray-500">({message.recipient})</span>
                            </div>
                            <Badge variant={statusInfo.color as any}>
                              {statusInfo.label}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{message.message}</p>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>Programado: {formatDateTime(message.scheduledDate)}</span>
                              {isScheduledInPast(message.scheduledDate) && message.status === 'pending' && (
                                <span className="text-red-500 font-medium">(Vencido)</span>
                              )}
                            </div>
                            {message.sentAt && (
                              <div className="flex items-center space-x-1">
                                <Send className="w-3 h-3" />
                                <span>Enviado: {formatDateTime(message.sentAt)}</span>
                              </div>
                            )}
                          </div>

                          {message.error && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                              Error: {message.error}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          {message.status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onSendNow(message.id)}
                                icon={<Play className="w-3 h-3" />}
                                title="Enviar ahora"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEditMessage(message)}
                                icon={<Edit className="w-3 h-3" />}
                                title="Editar"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onCancelMessage(message.id)}
                                icon={<Pause className="w-3 h-3" />}
                                title="Cancelar"
                              />
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDeleteMessage(message.id)}
                            icon={<Trash2 className="w-3 h-3" />}
                            className="text-red-600 hover:text-red-700"
                            title="Eliminar"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}