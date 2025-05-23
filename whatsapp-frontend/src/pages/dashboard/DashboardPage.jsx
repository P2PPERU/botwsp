import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  MessageCircle, 
  Users, 
  TrendingUp, 
  Activity,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Settings,
  LogOut,
  QrCode,
  RefreshCw,
  Smartphone,
  Globe,
  Zap,
  Bell
} from 'lucide-react'
import { useAuth } from '@context/AuthContext'
import { useWhatsApp } from '@context/WhatsAppContext'
import LoadingSpinner from '@components/ui/LoadingSpinner'

const DashboardPage = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { 
    isConnected, 
    sessionStatus,
    qrCode,        
    getQRCode, 
    closeSession, 
    restartSession,
    checkConnectionStatus,
    isLoading 
  } = useWhatsApp()
  
  const [stats, setStats] = useState({
    totalMessages: 0,
    activeClients: 0,
    responseRate: 0,
    uptime: 0,
    messagesThisWeek: 0,
    avgResponseTime: 0
  })

  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [isCheckingConnection, setIsCheckingConnection] = useState(false)
  
  // Refs para cleanup
  const connectionCheckInterval = useRef(null)
  const connectionTimeout = useRef(null)

  useEffect(() => {
    // Simular carga de estadísticas desde la API
    const loadStats = async () => {
      setIsLoadingStats(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        setStats({
          totalMessages: 1248,
          activeClients: 47,
          responseRate: 98.5,
          uptime: 99.9,
          messagesThisWeek: 234,
          avgResponseTime: 2.3
        })
      } catch (error) {
        console.error('Error loading stats:', error)
      } finally {
        setIsLoadingStats(false)
      }
    }

    loadStats()
  }, [])

  // Cleanup al desmontar componente
  useEffect(() => {
    return () => {
      clearConnectionChecks()
    }
  }, [])

  // Cleanup de intervalos
  const clearConnectionChecks = () => {
    if (connectionCheckInterval.current) {
      clearInterval(connectionCheckInterval.current)
      connectionCheckInterval.current = null
    }
    if (connectionTimeout.current) {
      clearTimeout(connectionTimeout.current)
      connectionTimeout.current = null
    }
  }

  // Función de navegación
  const handleNavigation = (path) => {
    navigate(path)
  }

  // Navegación específica para ir al chat
  const handleGoToChat = () => {
    navigate('/chat')
  }

  // Navegación para configuración
  const handleGoToSettings = () => {
    navigate('/settings')
  }

  const statCards = [
    {
      title: 'Mensajes Enviados',
      value: isLoadingStats ? '...' : stats.totalMessages.toLocaleString(),
      icon: MessageCircle,
      color: 'text-whatsapp-600',
      bgColor: 'bg-whatsapp-100 dark:bg-whatsapp-900',
      change: '+12%',
      changeType: 'positive',
      subtitle: 'Total histórico'
    },
    {
      title: 'Clientes Activos',
      value: isLoadingStats ? '...' : stats.activeClients,
      icon: Users,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100 dark:bg-primary-900',
      change: '+8%',
      changeType: 'positive',
      subtitle: 'Este mes'
    },
    {
      title: 'Tasa de Respuesta',
      value: isLoadingStats ? '...' : `${stats.responseRate}%`,
      icon: TrendingUp,
      color: 'text-success-600',
      bgColor: 'bg-success-100 dark:bg-success-900',
      change: '+2.1%',
      changeType: 'positive',
      subtitle: 'Últimos 30 días'
    },
    {
      title: 'Tiempo Activo',
      value: isLoadingStats ? '...' : `${stats.uptime}%`,
      icon: Activity,
      color: 'text-warning-600',
      bgColor: 'bg-warning-100 dark:bg-warning-900',
      change: '0%',
      changeType: 'neutral',
      subtitle: 'Este mes'
    }
  ]

  const recentActivities = [
    {
      id: 1,
      type: 'message',
      title: 'Mensaje enviado a +51987654321',
      description: 'Información sobre precios enviada',
      time: 'Hace 2 minutos',
      status: 'delivered',
      icon: Send
    },
    {
      id: 2,
      type: 'client',
      title: 'Nuevo cliente registrado',
      description: 'Juan Pérez se registró en el sistema',
      time: 'Hace 15 minutos',
      status: 'success',
      icon: Users
    },
    {
      id: 3,
      type: 'system',
      title: 'Sistema actualizado',
      description: 'Nueva versión 2.1.0 instalada',
      time: 'Hace 1 hora',
      status: 'info',
      icon: RefreshCw
    },
    {
      id: 4,
      type: 'error',
      title: 'Error en envío masivo',
      description: 'Falló el envío a 3 de 50 contactos',
      time: 'Hace 2 horas',
      status: 'error',
      icon: AlertCircle
    },
    {
      id: 5,
      type: 'notification',
      title: 'Recordatorio configurado',
      description: 'Nuevo recordatorio para cliente VIP',
      time: 'Hace 3 horas',
      status: 'info',
      icon: Bell
    }
  ]

  // Acciones rápidas con navegación
  const quickActions = [
    {
      title: 'Enviar Mensaje',
      description: 'Envía un mensaje rápido',
      icon: Send,
      color: 'whatsapp',
      action: () => handleNavigation('/chat')
    },
    {
      title: 'Gestionar Clientes',
      description: 'Ver y editar clientes',
      icon: Users,
      color: 'primary',
      action: () => handleNavigation('/clients')
    },
    {
      title: 'Ver Reportes',
      description: 'Analiza tu rendimiento',
      icon: BarChart3,
      color: 'success',
      action: () => handleNavigation('/reports')
    },
    {
      title: 'Configuración',
      description: 'Ajustar configuración',
      icon: Settings,
      color: 'gray',
      action: () => handleNavigation('/settings')
    }
  ]

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-success-500" />
      case 'success':
        return <CheckCircle className="w-4 h-4 text-success-500" />
      case 'info':
        return <Activity className="w-4 h-4 text-primary-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-error-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (sessionStatus) {
      case 'connected':
        return 'text-success-600'
      case 'connecting':
        return 'text-warning-600'
      case 'disconnected':
        return 'text-gray-600'
      case 'error':
        return 'text-error-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusText = () => {
    switch (sessionStatus) {
      case 'connected':
        return 'Conectado'
      case 'connecting':
        return 'Conectando...'
      case 'disconnected':
        return 'Desconectado'
      case 'error':
        return 'Error de conexión'
      default:
        return 'Verificando...'
    }
  }

  const getStatusBgColor = () => {
    switch (sessionStatus) {
      case 'connected':
        return 'bg-success-100 dark:bg-success-900 border-success-200 dark:border-success-800'
      case 'connecting':
        return 'bg-warning-100 dark:bg-warning-900 border-warning-200 dark:border-warning-800'
      case 'disconnected':
        return 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      case 'error':
        return 'bg-error-100 dark:bg-error-900 border-error-200 dark:border-error-800'
      default:
        return 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
    }
  }

  // Iniciar verificación automática de conexión - PRODUCCIÓN
  const startConnectionCheck = () => {
    // Limpiar verificaciones anteriores
    clearConnectionChecks()
    
    console.log('🔄 Iniciando verificación automática de conexión...')
    
    // Verificar cada 3 segundos
    connectionCheckInterval.current = setInterval(async () => {
      if (!isConnected) {
        console.log('🔍 Verificando estado de conexión...')
        await checkConnectionStatus()
      } else {
        // Si ya está conectado, limpiar la verificación
        console.log('✅ WhatsApp conectado! Deteniendo verificación automática.')
        clearConnectionChecks()
      }
    }, 5000)
    
    // Timeout de seguridad: detener después de 3 minutos
    connectionTimeout.current = setTimeout(() => {
      console.log('⏰ Timeout de verificación alcanzado. Deteniendo verificación automática.')
      clearConnectionChecks()
    }, 180000) // 3 minutos
  }

  const handleConnectWhatsApp = async () => {
    try {
      console.log('🔗 Obteniendo código QR...')
      await getQRCode()
      
      // Iniciar verificación automática después de mostrar QR
      startConnectionCheck()
      
    } catch (error) {
      console.error('❌ Error al obtener QR:', error)
    }
  }

  const handleRestartSession = async () => {
    try {
      console.log('🔄 Reiniciando sesión...')
      clearConnectionChecks() // Limpiar verificaciones anteriores
      await restartSession()
      
      // Esperar un poco y luego obtener nuevo QR
      setTimeout(async () => {
        await getQRCode()
        startConnectionCheck()
      }, 2000)
      
    } catch (error) {
      console.error('❌ Error al reiniciar sesión:', error)
    }
  }

  const handleCloseSession = async () => {
    try {
      console.log('🚪 Cerrando sesión...')
      clearConnectionChecks() // Limpiar verificaciones
      await closeSession()
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error)
    }
  }

  // Verificación manual de conexión
  const handleManualCheck = async () => {
    try {
      setIsCheckingConnection(true)
      console.log('🔍 Verificación manual de conexión...')
      await checkConnectionStatus()
    } catch (error) {
      console.error('❌ Error en verificación manual:', error)
    } finally {
      setIsCheckingConnection(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header con navegación */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-whatsapp-500 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  WhatsApp Hub
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Dashboard Principal
                </p>
              </div>
            </div>

            {/* Navegación */}
            <nav className="hidden md:flex items-center gap-4">
              <button
                onClick={() => handleNavigation('/dashboard')}
                className="px-3 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-lg"
              >
                Dashboard
              </button>
              <button
                onClick={() => handleNavigation('/chat')}
                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Chat
              </button>
              <button
                onClick={() => handleNavigation('/settings')}
                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Configuración
              </button>
            </nav>

            <div className="flex items-center gap-4">
              {/* Estado de conexión */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getStatusBgColor()}`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success-500' : 'bg-error-500'} ${isConnected ? 'animate-pulse' : ''}`} />
                <span className={`text-sm font-medium ${getStatusColor()}`}>
                  {getStatusText()}
                </span>
              </div>

              {/* Menú de usuario */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleGoToSettings}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Settings className="w-5 h-5" />
                </button>
                <button 
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-sm font-medium text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Saludo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ¡Hola, {user?.name || 'Usuario'}! 👋
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Aquí tienes un resumen de tu actividad en WhatsApp Hub
          </p>
        </motion.div>

        {/* Cards de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card-hover p-6 relative overflow-hidden"
            >
              {/* Fondo decorativo */}
              <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
                <stat.icon className="w-full h-full" />
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center shadow-lg`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                  stat.changeType === 'positive' ? 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300' : 
                  stat.changeType === 'negative' ? 'bg-error-100 text-error-700 dark:bg-error-900 dark:text-error-300' : 
                  'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}>
                  {stat.change}
                </span>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {isLoadingStats ? (
                  <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                ) : (
                  stat.value
                )}
              </h3>
              
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                {stat.title}
              </p>
              
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {stat.subtitle}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Estado de WhatsApp */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-whatsapp-500" />
                  Estado de WhatsApp
                </h3>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-success-500 animate-pulse' : 'bg-error-500'}`} />
                  <span className={`text-sm font-medium ${getStatusColor()}`}>
                    {getStatusText()}
                  </span>
                </div>
              </div>

              {/* SECCIÓN PRINCIPAL - QR O ESTADO CONECTADO */}
              {!isConnected && (
                <div className="text-center py-8">
                  {/* Si hay QR code, mostrarlo */}
                  {qrCode ? (
                    <div>
                      <div className="w-64 h-64 mx-auto mb-4 bg-white p-4 rounded-lg shadow-lg border">
                        <img 
                          src={qrCode} 
                          alt="QR Code para WhatsApp" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        📱 Escanea el código QR
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
                        Abre WhatsApp → Menú (⋮) → Dispositivos vinculados → Vincular dispositivo
                      </p>
                      
                      {/* Indicador de verificación automática */}
                      <div className="mb-6">
                        <div className="flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400 mb-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          Verificando conexión automáticamente...
                        </div>
                      </div>
                      
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={handleConnectWhatsApp}
                          disabled={isLoading}
                          className="btn-secondary flex items-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Nuevo QR
                        </button>
                        <button
                          onClick={handleManualCheck}
                          disabled={isCheckingConnection}
                          className="btn-primary flex items-center gap-2"
                        >
                          {isCheckingConnection ? (
                            <LoadingSpinner size="sm" color="white" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                          Verificar Estado
                        </button>
                        <button
                          onClick={handleRestartSession}
                          disabled={isLoading}
                          className="btn-secondary flex items-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Reiniciar
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Si no hay QR, mostrar botón para obtenerlo */
                    <div>
                      <div className="w-16 h-16 bg-warning-100 dark:bg-warning-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <QrCode className="w-8 h-8 text-warning-600 dark:text-warning-400" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        WhatsApp no está conectado
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                        Conecta tu cuenta de WhatsApp escaneando el código QR para comenzar a enviar mensajes
                      </p>
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={handleConnectWhatsApp}
                          disabled={isLoading}
                          className="btn-success flex items-center gap-2"
                        >
                          {isLoading ? (
                            <LoadingSpinner size="sm" color="white" />
                          ) : (
                            <QrCode className="w-4 h-4" />
                          )}
                          Conectar WhatsApp
                        </button>
                        <button
                          onClick={handleRestartSession}
                          disabled={isLoading}
                          className="btn-secondary flex items-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Reiniciar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isConnected && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-success-100 dark:bg-success-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-success-600 dark:text-success-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    ¡WhatsApp conectado correctamente!
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Tu cuenta está lista para enviar y recibir mensajes
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button 
                      onClick={handleGoToChat}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Ir al Chat
                    </button>
                    <button
                      onClick={handleCloseSession}
                      className="btn-danger flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Desconectar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Actividad reciente */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary-500" />
                Actividad Reciente
              </h3>
              
              <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin">
                {recentActivities.map((activity, index) => (
                  <motion.div 
                    key={activity.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      {getStatusIcon(activity.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <button className="w-full mt-4 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium py-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors">
                Ver toda la actividad →
              </button>
            </div>
          </motion.div>
        </div>

        {/* Acciones rápidas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-warning-500" />
            Acciones Rápidas
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={action.action}
                className="card-hover p-4 text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 ${
                    action.color === 'whatsapp' ? 'bg-whatsapp-100 dark:bg-whatsapp-900' :
                    action.color === 'primary' ? 'bg-primary-100 dark:bg-primary-900' :
                    action.color === 'success' ? 'bg-success-100 dark:bg-success-900' :
                    'bg-gray-100 dark:bg-gray-800'
                  } rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                    <action.icon className={`w-6 h-6 ${
                      action.color === 'whatsapp' ? 'text-whatsapp-600 dark:text-whatsapp-400' :
                      action.color === 'primary' ? 'text-primary-600 dark:text-primary-400' :
                      action.color === 'success' ? 'text-success-600 dark:text-success-400' :
                      'text-gray-600 dark:text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {action.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {action.description}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  )
}

export default DashboardPage