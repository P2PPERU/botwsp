// src/components/messaging/BulkMessaging.tsx
'use client';

import React, { useState } from 'react';
import { Users, Send, Eye, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Client } from '@/types/whatsapp';

interface BulkMessagingProps {
  clients: Client[];
  onSendBulk: (data: {
    recipients: string[];
    message: string;
    delay?: number;
    scheduleFor?: Date;
  }) => Promise<void>;
}

export function BulkMessaging({ clients, onSendBulk }: BulkMessagingProps) {
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [delay, setDelay] = useState(2000);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterService, setFilterService] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.phone.includes(searchTerm) ||
                         client.service.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
    const matchesService = filterService === 'all' || client.service === filterService;
    
    return matchesSearch && matchesStatus && matchesService;
  });

  const handleSelectAll = () => {
    if (selectedClients.length === filteredClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredClients.map(c => c.phone));
    }
  };

  const handleClientToggle = (phone: string) => {
    setSelectedClients(prev =>
      prev.includes(phone)
        ? prev.filter(p => p !== phone)
        : [...prev, phone]
    );
  };

  const handleSend = async () => {
    if (!message.trim() || selectedClients.length === 0 || sending) return;

    setSending(true);
    try {
      await onSendBulk({
        recipients: selectedClients,
        message: message.trim(),
        delay
      });
      
      setMessage('');
      setSelectedClients([]);
      alert(`Mensaje enviado a ${selectedClients.length} clientes`);
    } catch (error) {
      console.error('Error sending bulk message:', error);
      alert('Error al enviar mensajes masivos');
    } finally {
      setSending(false);
    }
  };

  const personalizeMessage = (message: string, client: Client) => {
    return message
      .replace(/\{name\}/g, client.name)
      .replace(/\{service\}/g, client.service)
      .replace(/\{plan\}/g, client.plan || '')
      .replace(/\{expiry\}/g, client.expiry);
  };

  const messageTemplates = [
    {
      name: 'Recordatorio de vencimiento',
      message: `Hola {name}! 👋

Tu suscripción de {service} vence pronto. 

📅 Fecha de vencimiento: {expiry}
💰 Plan: {plan}

Para renovar, responde a este mensaje 😊`
    },
    {
      name: 'Promoción especial',
      message: `¡Hola {name}! 🎉

Tenemos una oferta especial para ti:

🔥 50% OFF en tu renovación de {service}
⏰ Válido hasta fin de mes

¡No te lo pierdas! Responde YA para activar tu descuento 🚀`
    },
    {
      name: 'Bienvenida',
      message: `¡Bienvenido/a {name}! 🎊

Gracias por confiar en nosotros para tu suscripción de {service}.

✅ Tu servicio está activo
📱 Cualquier duda, estamos aquí para ayudarte

¡Disfruta tu contenido favorito! 🍿`
    }
  ];

  const services = [...new Set(clients.map(c => c.service))];

  return (
    <div className="h-full flex">
      {/* Panel izquierdo - Selección de clientes */}
      <div className="w-2/3 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Seleccionar destinatarios
            </h2>
            <Badge variant="info">
              {selectedClients.length} seleccionados
            </Badge>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="expiring">Por vencer</option>
              <option value="expired">Vencidos</option>
            </select>
            <select
              value={filterService}
              onChange={(e) => setFilterService(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los servicios</option>
              {services.map(service => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista de clientes */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedClients.length === filteredClients.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </Button>
              <span className="text-sm text-gray-600">
                {filteredClients.length} clientes encontrados
              </span>
            </div>

            <div className="space-y-2">
              {filteredClients.map(client => (
                <div
                  key={client.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedClients.includes(client.phone)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleClientToggle(client.phone)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedClients.includes(client.phone)}
                        onChange={() => handleClientToggle(client.phone)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{client.name}</p>
                        <p className="text-sm text-gray-600">{client.service}</p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        client.status === 'active' ? 'success' :
                        client.status === 'expiring' ? 'warning' :
                        client.status === 'expired' ? 'danger' : 'default'
                      }
                    >
                      {client.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho - Composer de mensaje */}
      <div className="w-1/3 flex flex-col">
        {/* Plantillas */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">Plantillas rápidas</h3>
          <div className="grid grid-cols-1 gap-2">
            {messageTemplates.map((template, index) => (
              <button
                key={index}
                onClick={() => setMessage(template.message)}
                className="text-left p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm"
              >
                <p className="font-medium text-gray-900">{template.name}</p>
                <p className="text-gray-600 text-xs mt-1 truncate">
                  {template.message.substring(0, 60)}...
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Compositor */}
        <div className="flex-1 p-4 flex flex-col">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensaje (personalizable con {'{name}'}, {'{service}'}, {'{plan}'}, {'{expiry}'})
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {message.length}/4096 caracteres
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delay entre mensajes (ms)
            </label>
            <Input
              type="number"
              value={delay}
              onChange={(e) => setDelay(parseInt(e.target.value))}
              min={1000}
              max={10000}
            />
            <p className="text-xs text-gray-500 mt-1">
              Recomendado: 2000ms para evitar bloqueos
            </p>
          </div>

          <div className="flex space-x-2 mb-4">
            <Button
              variant="outline"
              onClick={() => setShowPreview(true)}
              icon={<Eye className="w-4 h-4" />}
              disabled={!message.trim() || selectedClients.length === 0}
            >
              Vista previa
            </Button>
          </div>

          <Button
            onClick={handleSend}
            disabled={!message.trim() || selectedClients.length === 0 || sending}
            isLoading={sending}
            icon={<Send className="w-4 h-4" />}
            className="w-full"
          >
            Enviar a {selectedClients.length} cliente{selectedClients.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>

      {/* Modal de vista previa */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Vista previa del mensaje</h3>
            <div className="space-y-4">
              {selectedClients.slice(0, 3).map(phone => {
                const client = clients.find(c => c.phone === phone);
                if (!client) return null;
                
                return (
                  <div key={phone} className="border rounded-lg p-3">
                    <p className="font-medium text-sm text-gray-600 mb-2">
                      Para: {client.name} ({client.phone})
                    </p>
                    <div className="bg-blue-500 text-white p-3 rounded-lg text-sm">
                      {personalizeMessage(message, client)}
                    </div>
                  </div>
                );
              })}
              {selectedClients.length > 3 && (
                <p className="text-sm text-gray-500 text-center">
                  ... y {selectedClients.length - 3} más
                </p>
              )}
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}