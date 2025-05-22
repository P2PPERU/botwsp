// src/components/clients/ClientForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { Client } from '@/types/whatsapp';

interface ClientFormProps {
  client?: Client | null;
  onSave: () => void;
  onCancel: () => void;
}

export function ClientForm({ client, onSave, onCancel }: ClientFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    service: '',
    plan: '',
    expiry: '',
    status: 'active' as 'active' | 'expiring' | 'expired' | 'suspended' // ← Corregir tipo
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!client;

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        phone: client.phone || '',
        service: client.service || '',
        plan: client.plan || '',
        expiry: client.expiry || '',
        status: client.status || 'active'
      });
    }
  }, [client]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    } else if (!/^[0-9+\-\s\(\)]{8,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Formato de teléfono inválido';
    }

    if (!formData.service.trim()) {
      newErrors.service = 'El servicio es requerido';
    }

    if (!formData.expiry) {
      newErrors.expiry = 'La fecha de vencimiento es requerida';
    } else if (new Date(formData.expiry) < new Date()) {
      newErrors.expiry = 'La fecha de vencimiento debe ser futura';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isEditing && client) {
        await api.clients.update(client.id, formData);
      } else {
        await api.clients.create(formData);
      }
      onSave();
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Error al guardar cliente');
    } finally {
      setLoading(false);
    }
  };

  const services = [
    'Netflix Premium',
    'Netflix Familiar',
    'Disney+ Familiar',
    'Prime Video',
    'HBO Max',
    'Spotify Premium',
    'YouTube Premium'
  ];

  const plans = [
    'Básico',
    'Estándar',
    'Premium',
    'Familiar'
  ];

  const statusOptions = [
    { value: 'active', label: 'Activo' },
    { value: 'expiring', label: 'Por vencer' },
    { value: 'expired', label: 'Vencido' },
    { value: 'suspended', label: 'Suspendido' }
  ];

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre completo *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            placeholder="Juan Pérez"
          />

          <Input
            label="Teléfono *"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            error={errors.phone}
            placeholder="51987654321"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Servicio *
            </label>
            <select
              value={formData.service}
              onChange={(e) => setFormData({ ...formData, service: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seleccionar servicio</option>
              {services.map(service => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
            {errors.service && (
              <p className="text-sm text-red-600">{errors.service}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Plan
            </label>
            <select
              value={formData.plan}
              onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seleccionar plan</option>
              {plans.map(plan => (
                <option key={plan} value={plan}>{plan}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="date"
            label="Fecha de vencimiento *"
            value={formData.expiry}
            onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
            error={errors.expiry}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Estado
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'expiring' | 'expired' | 'suspended' })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Información adicional para edición */}
        {isEditing && client && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-medium text-gray-900">Información adicional</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Cliente desde:</span> {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'N/A'}
              </div>
              <div>
                <span className="font-medium">Última actualización:</span> {client.updatedAt ? new Date(client.updatedAt).toLocaleDateString() : 'N/A'}
              </div>
              {client.lastPayment && (
                <div>
                  <span className="font-medium">Último pago:</span> {new Date(client.lastPayment).toLocaleDateString()}
                </div>
              )}
              {client.suspendedAt && (
                <div>
                  <span className="font-medium">Suspendido el:</span> {new Date(client.suspendedAt).toLocaleDateString()}
                </div>
              )}
            </div>
            {client.suspensionReason && (
              <div>
                <span className="font-medium text-gray-900">Motivo de suspensión:</span>
                <p className="text-red-600 mt-1">{client.suspensionReason}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            isLoading={loading}
            disabled={loading}
          >
            {isEditing ? 'Actualizar' : 'Crear'} Cliente
          </Button>
        </div>
      </form>
    </div>
  );
}