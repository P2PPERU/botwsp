// src/components/messaging/MessageComposer.tsx
import React, { useState } from 'react';
import { Send, Paperclip, Smile, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface MessageComposerProps {
  recipient?: string;
  onSend: (message: { phone: string; message: string; type?: 'individual' | 'broadcast' }) => void;
  onSchedule?: (message: { phone: string; message: string; scheduleDate: string }) => void;
}

export function MessageComposer({ recipient = '', onSend, onSchedule }: MessageComposerProps) {
  const [phone, setPhone] = useState(recipient);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'individual' | 'broadcast'>('individual');
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');

  const handleSend = () => {
    if (!phone || !message) {
      alert('Por favor completa todos los campos');
      return;
    }

    if (showSchedule && scheduleDate) {
      onSchedule?.({ phone, message, scheduleDate });
    } else {
      onSend({ phone, message, type: messageType });
    }

    // Limpiar formulario
    if (!recipient) setPhone(''); // Solo limpiar si no hay recipient predefinido
    setMessage('');
    setScheduleDate('');
    setShowSchedule(false);
  };

  const quickTemplates = [
    { name: 'Saludo', text: '¡Hola! 👋 ¿En qué puedo ayudarte?' },
    { name: 'Gracias', text: '¡Gracias por contactarnos! Te responderemos pronto.' },
    { name: 'Información', text: 'Te envío la información que solicitaste 📄' }
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Componer Mensaje</h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMessageType(messageType === 'individual' ? 'broadcast' : 'individual')}
            icon={messageType === 'broadcast' ? <Users className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          >
            {messageType === 'broadcast' ? 'Difusión' : 'Individual'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSchedule(!showSchedule)}
            icon={<Calendar className="w-4 h-4" />}
          >
            {showSchedule ? 'Enviar Ahora' : 'Programar'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Campo de teléfono/destinatario */}
        <div>
          <Input
            label={messageType === 'broadcast' ? 'Lista de teléfonos (separados por comas)' : 'Número de teléfono'}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={messageType === 'broadcast' ? '51987654321, 51923456789' : '51987654321'}
            disabled={!!recipient}
          />
        </div>

        {/* Fecha de programación */}
        {showSchedule && (
          <div>
            <Input
              type="datetime-local"
              label="Fecha y hora de envío"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
            />
          </div>
        )}

        {/* Campo de mensaje */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mensaje
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe tu mensaje aquí..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>{message.length}/1000 caracteres</span>
          </div>
        </div>

        {/* Plantillas rápidas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Plantillas Rápidas
          </label>
          <div className="flex flex-wrap gap-2">
            {quickTemplates.map((template) => (
              <button
                key={template.name}
                onClick={() => setMessage(template.text)}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                {template.name}
              </button>
            ))}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Paperclip className="w-4 h-4" />}
            >
              Adjuntar
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Smile className="w-4 h-4" />}
            >
              Emoji
            </Button>
          </div>
          
          <Button
            onClick={handleSend}
            disabled={!phone || !message}
            icon={showSchedule ? <Calendar className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          >
            {showSchedule ? 'Programar' : 'Enviar'}
          </Button>
        </div>
      </div>
    </div>
  );
}