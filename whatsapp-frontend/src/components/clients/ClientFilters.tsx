// src/components/clients/ClientFilters.tsx
import React from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ClientFiltersProps {
  statusFilter: string;
  serviceFilter: string;
  onStatusChange: (status: string) => void;
  onServiceChange: (service: string) => void;
  onClear: () => void;
}

export function ClientFilters({
  statusFilter,
  serviceFilter,
  onStatusChange,
  onServiceChange,
  onClear
}: ClientFiltersProps) {
  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'active', label: 'Activo' },
    { value: 'expiring', label: 'Por vencer' },
    { value: 'expired', label: 'Vencido' },
    { value: 'suspended', label: 'Suspendido' }
  ];

  const serviceOptions = [
    { value: '', label: 'Todos los servicios' },
    { value: 'Netflix Premium', label: 'Netflix Premium' },
    { value: 'Netflix Familiar', label: 'Netflix Familiar' },
    { value: 'Disney+ Familiar', label: 'Disney+ Familiar' },
    { value: 'Prime Video', label: 'Prime Video' },
    { value: 'HBO Max', label: 'HBO Max' },
    { value: 'Spotify Premium', label: 'Spotify Premium' },
    { value: 'YouTube Premium', label: 'YouTube Premium' }
  ];

  const hasFilters = statusFilter || serviceFilter;

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-gray-700">Filtros</span>
        </div>
        {hasFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            icon={<X className="w-3 h-3" />}
          >
            Limpiar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Servicio
          </label>
          <select
            value={serviceFilter}
            onChange={(e) => onServiceChange(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            {serviceOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}