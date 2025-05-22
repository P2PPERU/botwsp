// src/components/clients/ClientsPage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Search, Filter, Download, Upload, 
  Edit, Trash2, Eye, RefreshCw, Calendar, AlertCircle,
  CheckCircle, XCircle, Clock, UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { ClientForm } from './ClientForm';
import { ClientDetails } from './ClientDetails';
import { ClientImport } from './ClientImport';
import { ClientFilters } from './ClientFilters';
import api from '@/lib/api';
import { Client } from '@/types/whatsapp';
import { formatDate, formatPhone } from '@/lib/utils';

interface ClientsPageProps {
  onSendMessage?: (phone: string, name: string) => void;
}

export function ClientsPage({ onSendMessage }: ClientsPageProps) {
  // Estados principales
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // Estados de modales
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados de filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Cargar clientes
  useEffect(() => {
    loadClients();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    applyFilters();
  }, [clients, searchTerm, statusFilter, serviceFilter, sortKey, sortDirection]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await api.clients.getAll();
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...clients];

    // Búsqueda por texto
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(term) ||
        client.phone.includes(term) ||
        client.service.toLowerCase().includes(term)
      );
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(client => client.status === statusFilter);
    }

    // Filtro por servicio
    if (serviceFilter !== 'all') {
      filtered = filtered.filter(client => client.service === serviceFilter);
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      const aVal = a[sortKey as keyof Client] || '';
      const bVal = b[sortKey as keyof Client] || '';
      
      if (sortDirection === 'asc') {
        return String(aVal).localeCompare(String(bVal));
      } else {
        return String(bVal).localeCompare(String(aVal));
      }
    });

    setFilteredClients(filtered);
  };

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortKey(key);
    setSortDirection(direction);
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setShowForm(true);
  };

  const handleDelete = async (client: Client) => {
    if (confirm(`¿Estás seguro de eliminar a ${client.name}?`)) {
      try {
        await api.clients.delete(client.id);
        await loadClients();
      } catch (error) {
        console.error('Error deleting client:', error);
        alert('Error al eliminar cliente');
      }
    }
  };

  const handleView = (client: Client) => {
    setSelectedClient(client);
    setShowDetails(true);
  };

  const handleRenew = async (client: Client) => {
    try {
      // Calcular nueva fecha de vencimiento (30 días)
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 30);
      
      await api.clients.update(client.id, {
        expiry: newExpiry.toISOString().split('T')[0],
        status: 'active',
        lastPayment: new Date().toISOString().split('T')[0]
      });
      
      await loadClients();
      alert(`Suscripción renovada para ${client.name} hasta ${formatDate(newExpiry)}`);
    } catch (error) {
      console.error('Error renewing client:', error);
      alert('Error al renovar suscripción');
    }
  };

  const handleSuspend = async (client: Client) => {
    const reason = prompt('Motivo de suspensión:');
    if (reason) {
      try {
        await api.clients.update(client.id, {
          status: 'suspended',
          suspensionReason: reason,
          suspendedAt: new Date().toISOString()
        });
        await loadClients();
      } catch (error) {
        console.error('Error suspending client:', error);
        alert('Error al suspender cliente');
      }
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Nombre', 'Teléfono', 'Servicio', 'Plan', 'Vencimiento', 'Estado'],
      ...filteredClients.map(client => [
        client.name,
        client.phone,
        client.service,
        client.plan || '',
        client.expiry,
        client.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clientes_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      active: { variant: 'success', label: 'Activo', icon: CheckCircle },
      expiring: { variant: 'warning', label: 'Por vencer', icon: Clock },
      expired: { variant: 'danger', label: 'Vencido', icon: XCircle },
      suspended: { variant: 'default', label: 'Suspendido', icon: AlertCircle }
    };

    const config = configs[status as keyof typeof configs] || configs.active;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const columns = [
    {
      key: 'name',
      label: 'Cliente',
      sortable: true,
      render: (value: string, client: Client) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{formatPhone(client.phone)}</div>
        </div>
      )
    },
    {
      key: 'service',
      label: 'Servicio',
      sortable: true,
      render: (value: string, client: Client) => (
        <div>
          <div className="font-medium">{value}</div>
          {client.plan && <div className="text-sm text-gray-500">{client.plan}</div>}
        </div>
      )
    },
    {
      key: 'expiry',
      label: 'Vencimiento',
      sortable: true,
      render: (value: string) => (
        <div className="text-sm">
          {formatDate(value)}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Estado',
      render: (value: string) => getStatusBadge(value)
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (_: any, client: Client) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleView(client)}
            icon={<Eye className="w-4 h-4" />}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEdit(client)}
            icon={<Edit className="w-4 h-4" />}
          />
          {onSendMessage && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onSendMessage(client.phone, client.name)}
              className="text-green-600 hover:text-green-700"
            >
              💬
            </Button>
          )}
          {client.status === 'expiring' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRenew(client)}
              className="text-blue-600 hover:text-blue-700"
            >
              Renovar
            </Button>
          )}
          {client.status === 'active' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSuspend(client)}
              className="text-orange-600 hover:text-orange-700"
            >
              Suspender
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(client)}
            icon={<Trash2 className="w-4 h-4" />}
            className="text-red-600 hover:text-red-700"
          />
        </div>
      )
    }
  ];

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    expiring: clients.filter(c => c.status === 'expiring').length,
    expired: clients.filter(c => c.status === 'expired').length,
    suspended: clients.filter(c => c.status === 'suspended').length
  };

  const services = [...new Set(clients.map(c => c.service))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Users className="w-6 h-6 mr-2" />
            Gestión de Clientes
          </h1>
          <p className="text-gray-600 mt-1">
            {filteredClients.length} de {clients.length} clientes
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => setShowImport(true)}
            variant="outline"
            icon={<Upload className="w-4 h-4" />}
          >
            Importar
          </Button>
          <Button
            onClick={exportData}
            variant="outline"
            icon={<Download className="w-4 h-4" />}
          >
            Exportar
          </Button>
          <Button
            onClick={loadClients}
            variant="outline"
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Actualizar
          </Button>
          <Button
            onClick={() => {
              setSelectedClient(null);
              setShowForm(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Activos</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Por Vencer</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.expiring}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Vencidos</p>
              <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Suspendidos</p>
              <p className="text-2xl font-bold text-gray-600">{stats.suspended}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nombre, teléfono o servicio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4 text-gray-400" />}
            />
          </div>
          <div className="flex space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="expiring">Por vencer</option>
              <option value="expired">Vencidos</option>
              <option value="suspended">Suspendidos</option>
            </select>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los servicios</option>
              {services.map(service => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de clientes */}
      <div className="bg-white rounded-lg border border-gray-200">
        <Table
          data={filteredClients}
          columns={columns}
          loading={loading}
          onSort={handleSort}
          sortKey={sortKey}
          sortDirection={sortDirection}
        />
      </div>

      {/* Modales */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setSelectedClient(null);
        }}
        title={selectedClient ? 'Editar Cliente' : 'Nuevo Cliente'}
        size="lg"
      >
        <ClientForm
          client={selectedClient}
          onSave={async () => {
            setShowForm(false);
            setSelectedClient(null);
            await loadClients();
          }}
          onCancel={() => {
            setShowForm(false);
            setSelectedClient(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={showDetails}
        onClose={() => {
          setShowDetails(false);
          setSelectedClient(null);
        }}
        title="Detalles del Cliente"
        size="xl"
      >
        {selectedClient && (
          <ClientDetails
            client={selectedClient}
            onEdit={() => {
              setShowDetails(false);
              setShowForm(true);
            }}
            onSendMessage={onSendMessage}
          />
        )}
      </Modal>

      <Modal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        title="Importar Clientes"
        size="lg"
      >
        <ClientImport
          onSuccess={async () => {
            setShowImport(false);
            await loadClients();
          }}
          onCancel={() => setShowImport(false)}
        />
      </Modal>
    </div>
  );
}