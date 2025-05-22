// src/components/clients/ClientDetails.tsx
import React from 'react';
import { 
  Phone, Calendar, CreditCard, AlertCircle, 
  Edit, MessageSquare, RefreshCw, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Client } from '@/types/whatsapp';
import { formatDate, formatPhone } from '@/lib/utils';

interface ClientDetailsProps {
  client: Client;
  onEdit: () => void;
  onSendMessage?: (phone: string, name: string) => void;
}

export function ClientDetails({ client, onEdit, onSendMessage }: ClientDetailsProps) {
  const getStatusInfo = (status: string) => {
    const configs = {
      active: { color: 'success', label: 'Activo', icon: '✅' },
      expiring: { color: 'warning', label: 'Por vencer', icon: '⚠️' },
      expired: { color: 'danger', label: 'Vencido', icon: '❌' },
      suspended: { color: 'default', label: 'Suspendido', icon: '⏸️' }
    };
    return configs[status as keyof typeof configs] || configs.active;
  };

  const statusInfo = getStatusInfo(client.status);
  
  const daysToExpiry = Math.floor(
    (new Date(client.expiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-6">
      {/* Header del cliente */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{client.name}</h2>
          <p className="text-gray-600 mt-1">{formatPhone(client.phone)}</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={onEdit}
            icon={<Edit className="w-4 h-4" />}
          >
            Editar
          </Button>
          {onSendMessage && (
            <Button
              variant="outline"
              onClick={() => onSendMessage(client.phone, client.name)}
              icon={<MessageSquare className="w-4 h-4" />}
              className="text-green-600 hover:text-green-700"
            >
              Enviar Mensaje
            </Button>
          )}
        </div>
      </div>

      {/* Información principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Detalles del servicio */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Información del Servicio
          </h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <span className="text-2xl mr-2">📺</span>
              <div>
                <p className="font-medium">{client.service}</p>
                {client.plan && (
                  <p className="text-sm text-gray-600">Plan: {client.plan}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-gray-400 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Vencimiento</p>
                <p className="font-medium">{formatDate(client.expiry)}</p>
                {daysToExpiry >= 0 && (
                  <p className="text-sm text-gray-500">
                    {daysToExpiry === 0 ? 'Vence hoy' : 
                     daysToExpiry === 1 ? 'Vence mañana' :
                     `${daysToExpiry} días restantes`}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center">
              <span className="text-xl mr-2">{statusInfo.icon}</span>
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <Badge variant={statusInfo.color as any}>
                  {statusInfo.label}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Información de pagos */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Información de Pagos
          </h3>
          <div className="space-y-3">
            {client.lastPayment && (
              <div className="flex items-center">
                <CreditCard className="w-5 h-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Último pago</p>
                  <p className="font-medium">{formatDate(client.lastPayment)}</p>
                </div>
              </div>
            )}

            {client.status === 'suspended' && client.suspensionReason && (
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-400 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Motivo de suspensión</p>
                  <p className="font-medium text-red-600">{client.suspensionReason}</p>
                  {client.suspendedAt && (
                    <p className="text-sm text-gray-500">
                      Suspendido el {formatDate(client.suspendedAt)}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center">
              <Clock className="w-5 h-5 text-gray-400 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Cliente desde</p>
                <p className="font-medium">{formatDate(client.createdAt || '')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Acciones Rápidas
        </h3>
        <div className="flex flex-wrap gap-2">
          {client.status === 'expiring' && (
            <Button
              variant="outline"
              icon={<RefreshCw className="w-4 h-4" />}
              className="text-blue-600 hover:text-blue-700"
            >
              Renovar Suscripción
            </Button>
          )}
          
          {client.status === 'active' && (
            <Button
              variant="outline"
              className="text-orange-600 hover:text-orange-700"
            >
              Suspender Cliente
            </Button>
          )}
          
          {client.status === 'suspended' && (
            <Button
              variant="outline"
              className="text-green-600 hover:text-green-700"
            >
              Reactivar Cliente
            </Button>
          )}
          
          <Button
            variant="outline"
            className="text-purple-600 hover:text-purple-700"
          >
            Ver Historial de Mensajes
          </Button>
          
          <Button
            variant="outline"
            className="text-indigo-600 hover:text-indigo-700"
          >
            Generar Reporte
          </Button>
        </div>
      </div>

      {/* Notas adicionales */}
      {client.notes && (
        <div className="bg-yellow-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Notas
          </h3>
          <p className="text-gray-700">{client.notes}</p>
        </div>
      )}
    </div>
  );
}