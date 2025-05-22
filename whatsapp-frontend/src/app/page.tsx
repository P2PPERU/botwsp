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
  XCircle,
  Zap,
  Activity,
  TrendingUp,
  Clock,
  DollarSign,
  UserPlus,
  MessageCircle,
  RefreshCw
} from 'lucide-react';
import api from '@/lib/api';

const WhatsAppDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [clients, setClients] = useState([]);
  const [messages, setMessages] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState({ phone: '', message: '' });
  const [sessionStatus, setSessionStatus] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Cargar datos en paralelo
      const [statsData, clientsData, messagesData, workflowsData, sessionData] = await Promise.all([
        api.stats.getGeneral().catch(() => null),
        api.clients.getAll().catch(() => []),
        api.messages.getHistory().catch(() => []),
        api.workflows.getActive().catch(() => []),
        api.sessions.getStatus().catch(() => null)
      ]);

      setStats(statsData);
      setClients(clientsData);
      setMessages(messagesData);
      setWorkflows(workflowsData);
      setSessionStatus(sessionData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
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
      loadDashboardData(); // Recargar datos
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error al enviar mensaje');
    }
  };

  const StatusBadge = ({ status, icon: Icon }) => {
    const getStatusConfig = (status) => {
      const configs = {
        connected: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
        disconnected: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
        active: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
        paused: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertCircle },
        expired: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
        expiring: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertCircle },
        delivered: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle },
        read: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
        sent: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: CheckCircle }
      };
      return configs[status] || configs.sent;
    };

    const config = getStatusConfig(status);
    const StatusIcon = Icon || config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <StatusIcon className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  };

  const MetricCard = ({ title, value, icon: Icon, change, color = 'blue' }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {change && (
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+{change}%</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  const DashboardContent = () => (
    <div className="space-y-8">
      {/* Header con estado de conexión */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">WhatsApp Hub</h1>
          <p className="text-gray-600 mt-1">Panel de control empresarial</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">
              {sessionStatus ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          <button 
            onClick={loadDashboardData}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Sesiones Activas"
          value={stats?.wppConnect?.connected ? '1' : '0'}
          icon={Phone}
          color="green"
        />
        <MetricCard
          title="Mensajes Hoy"
          value={stats?.messages?.today || '0'}
          icon={MessageSquare}
          change={15}
          color="blue"
        />
        <MetricCard
          title="Clientes Activos"
          value={stats?.clients?.active || clients.filter(c => c.status === 'active').length}
          icon={Users}
          change={8}
          color="purple"
        />
        <MetricCard
          title="Por Vencer"
          value={stats?.clients?.expiring || clients.filter(c => c.status === 'expiring').length}
          icon={Bell}
          color="orange"
        />
      </div>

      {/* Gráficos y datos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Actividad reciente */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Actividad Reciente</h3>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.slice(0, 5).map((msg, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      msg.fromMe ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {msg.fromMe ? (
                        <Send className="h-4 w-4 text-blue-600" />
                      ) : (
                        <MessageCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {msg.fromMe ? 'Tú' : msg.from}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{msg.message}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Clock className="w-3 h-3 text-gray-400" />
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <Workflow className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold">Workflows Activos</h3>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <div key={workflow.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Zap className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{workflow.name}</p>
                        <p className="text-xs text-gray-500">Última ejecución: {workflow.lastRun}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {workflow.triggers} ejecuciones
                      </span>
                      <StatusBadge status={workflow.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clientes próximos a vencer */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold">Clientes Próximos a Vencer</h3>
            </div>
            <span className="text-sm text-gray-500">
              {clients.filter(c => c.status === 'expiring').length} clientes
            </span>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.filter(c => c.status === 'expiring').slice(0, 6).map((client) => (
              <div key={client.id} className="border border-orange-200 bg-orange-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{client.name}</h4>
                  <StatusBadge status={client.status} />
                </div>
                <p className="text-sm text-gray-600">{client.service}</p>
                <p className="text-xs text-gray-500 mt-1">Vence: {client.expiry}</p>
                <div className="flex space-x-2 mt-3">
                  <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                    Renovar
                  </button>
                  <button className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
                    Contactar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const MessagesContent = () => (
    <div className="space-y-6">
      {/* Formulario de envío mejorado */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold flex items-center">
            <Send className="w-5 h-5 mr-2 text-blue-600" />
            Enviar Mensaje
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de teléfono
                </label>
                <input
                  type="text"
                  value={newMessage.phone}
                  onChange={(e) => setNewMessage({...newMessage, phone: e.target.value})}
                  placeholder="51987654321"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.phone || !newMessage.message}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium"
              >
                <Send className="h-4 w-4" />
                <span>Enviar Mensaje</span>
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Plantillas Rápidas</h4>
              <div className="space-y-2">
                {[
                  { label: 'Saludo', text: '¡Hola! 👋 ¿En qué puedo ayudarte hoy?' },
                  { label: 'Precios', text: 'Te envío información sobre nuestros planes de streaming 📺' },
                  { label: 'Soporte', text: 'Estoy aquí para ayudarte con cualquier problema técnico 🔧' }
                ].map((template) => (
                  <button
                    key={template.label}
                    onClick={() => setNewMessage({...newMessage, message: template.text})}
                    className="w-full text-left p-3 bg-white border border-gray-200 hover:border-blue-300 rounded-lg text-sm"
                  >
                    <span className="font-medium">{template.label}:</span>
                    <span className="text-gray-600 ml-2">{template.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de mensajes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold">Historial de Mensajes</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                  msg.fromMe 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm">{msg.message}</p>
                  <div className="flex items-center justify-between mt-2 text-xs opacity-75">
                    <span>{msg.time}</span>
                    <StatusBadge status={msg.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'messages', label: 'Mensajes', icon: MessageSquare },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'workflows', label: 'Workflows', icon: Workflow },
    { id: 'settings', label: 'Configuración', icon: Settings }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardContent />;
      case 'messages': return <MessagesContent />;
      case 'clients': return <div className="p-8 text-center text-gray-500">Módulo de clientes en desarrollo</div>;
      case 'workflows': return <div className="p-8 text-center text-gray-500">Módulo de workflows en desarrollo</div>;
      case 'settings': return <div className="p-8 text-center text-gray-500">Configuración en desarrollo</div>;
      default: return <DashboardContent />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">WhatsApp Hub</h1>
              <p className="text-xs text-gray-500">Sistema Empresarial</p>
            </div>
          </div>
        </div>
        
        <nav className="mt-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-50 transition-colors ${
                  activeTab === item.id 
                    ? 'bg-blue-50 border-r-2 border-blue-600 text-blue-600 font-medium' 
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Status del sistema */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${sessionStatus ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-xs text-gray-600">
              {sessionStatus ? 'Sistema Activo' : 'Desconectado'}
            </span>
          </div>
        </div>
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