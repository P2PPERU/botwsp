'use client';

import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  MessageSquare, 
  Settings, 
  Users, 
  BarChart3, 
  Bot, 
  Workflow, 
  Send, 
  QrCode, 
  Bell, 
  AlertCircle,
  CheckCircle,
  XCircle 
} from 'lucide-react';
import { WhatsAppSession, WhatsAppMessage, Client, N8nWorkflow } from '@/types/whatsapp';
import api from '@/lib/api';

const WhatsAppDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState({ phone: '', message: '' });

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Cargar datos en paralelo
      const [sessionStatus, messageHistory, clientList, workflowList] = await Promise.all([
        api.sessions.getStatus(),
        api.messages.getHistory(),
        api.clients.getAll(),
        api.workflows.getActive()
      ]);

      // Configurar sesiones
      setSessions([{
        id: 'tes4',
        name: 'Principal',
        status: sessionStatus.status ? 'connected' : 'disconnected',
        lastActivity: '2 min ago'
      }]);

      setMessages(messageHistory);
      setClients(clientList);
      setWorkflows(workflowList);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.phone || !newMessage.message) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      await api.messages.send(newMessage);
      setNewMessage({ phone: '', message: '' });
      alert('Mensaje enviado correctamente');
      
      // Recargar mensajes
      const updatedMessages = await api.messages.getHistory();
      setMessages(updatedMessages);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error al enviar mensaje');
    }
  };

  const generateQR = async () => {
    try {
      await api.sessions.startSession();
      alert('Sesión iniciada. Código QR generado.');
      // Recargar estado de sesiones
      loadInitialData();
    } catch (error) {
      console.error('Error generating QR:', error);
      alert('Error al generar código QR');
    }
  };

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const getStatusConfig = (status: string) => {
      const configs = {
        connected: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
        disconnected: { color: 'bg-red-100 text-red-800', icon: XCircle },
        active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
        paused: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
        expired: { color: 'bg-red-100 text-red-800', icon: XCircle },
        expiring: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
        delivered: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
        read: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
        sent: { color: 'bg-gray-100 text-gray-800', icon: CheckCircle }
      };
      return configs[status as keyof typeof configs] || configs.sent;
    };

    const config = getStatusConfig(status);
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  };

  const DashboardContent = () => (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Phone className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Sesiones Activas</p>
              <p className="text-2xl font-bold text-gray-900">
                {sessions.filter(s => s.status === 'connected').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Mensajes Hoy</p>
              <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Clientes Activos</p>
              <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Bell className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Por Vencer</p>
              <p className="text-2xl font-bold text-gray-900">
                {clients.filter(c => c.status === 'expiring').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mensajes recientes */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Mensajes Recientes</h3>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-4">Cargando mensajes...</div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{msg.from}</p>
                      <p className="text-sm text-gray-500 truncate">{msg.message}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-400">{msg.time}</span>
                        <StatusBadge status={msg.status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Workflows n8n */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Workflows n8n</h3>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-4">Cargando workflows...</div>
            ) : (
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <div key={workflow.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Workflow className="h-5 w-5 text-indigo-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{workflow.name}</p>
                        <p className="text-xs text-gray-500">Última ejecución: {workflow.lastRun}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">{workflow.triggers} disparos</span>
                      <StatusBadge status={workflow.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const MessagesContent = () => (
    <div className="space-y-6">
      {/* Formulario de envío */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Enviar Mensaje</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de teléfono
              </label>
              <input
                type="text"
                value={newMessage.phone}
                onChange={(e) => setNewMessage({...newMessage, phone: e.target.value})}
                placeholder="51987654321"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje
              </label>
              <textarea
                value={newMessage.message}
                onChange={(e) => setNewMessage({...newMessage, message: e.target.value})}
                placeholder="Escribe tu mensaje aquí..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={handleSendMessage}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Send className="h-4 w-4" />
            <span>Enviar Mensaje</span>
          </button>
        </div>
      </div>
    </div>
  );

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'sessions', label: 'Sesiones', icon: Phone },
    { id: 'messages', label: 'Mensajes', icon: MessageSquare },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'settings', label: 'Configuración', icon: Settings }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardContent />;
      case 'messages': return <MessagesContent />;
      default: return <DashboardContent />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <div className="flex items-center space-x-2">
            <Bot className="h-8 w-8 text-green-600" />
            <h1 className="text-xl font-bold text-gray-900">WhatsApp Hub</h1>
          </div>
        </div>
        
        <nav className="mt-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-50 ${
                  activeTab === item.id ? 'bg-green-50 border-r-2 border-green-600 text-green-600' : 'text-gray-700'
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppDashboard;