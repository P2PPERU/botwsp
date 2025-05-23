import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Smartphone, 
  Palette,
  Globe,
  Key,
  Database,
  Zap,
  Save,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Monitor,
  MessageCircle,
  Volume2,
  VolumeX,
  CheckCircle,
  AlertCircle,
  Trash2,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '@context/AuthContext'
import { useTheme } from '@context/ThemeContext'
import { useWhatsApp } from '@context/WhatsAppContext'
import LoadingSpinner from '@components/ui/LoadingSpinner'

const SettingsPage = () => {
  const { user, updateProfile, changePassword } = useAuth()
  const { theme, toggleTheme, setLightTheme, setDarkTheme, setSystemTheme } = useTheme()
  const { isConnected, closeSession, restartSession } = useWhatsApp()
  
  const [activeTab, setActiveTab] = useState('profile')
  const [isLoading, setIsLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Estados del formulario
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    company: user?.company || '',
    bio: user?.bio || ''
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    messageNotifications: true,
    soundEnabled: true,
    weeklyReports: true,
    maintenanceAlerts: true,
    newFeatures: false
  })

  const [whatsappSettings, setWhatsappSettings] = useState({
    autoReply: true,
    readReceipts: true,
    typingIndicator: true,
    onlineStatus: true,
    messageDelay: 2,
    bulkMessageDelay: 5,
    maxDailyMessages: 1000
  })

  const tabs = [
    {
      id: 'profile',
      name: 'Perfil',
      icon: User,
      description: 'Información personal y cuenta'
    },
    {
      id: 'notifications',
      name: 'Notificaciones',
      icon: Bell,
      description: 'Alertas y avisos'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: MessageCircle,
      description: 'Configuración de WhatsApp'
    },
    {
      id: 'security',
      name: 'Seguridad',
      icon: Shield,
      description: 'Contraseña y seguridad'
    },
    {
      id: 'appearance',
      name: 'Apariencia',
      icon: Palette,
      description: 'Tema y personalización'
    },
    {
      id: 'advanced',
      name: 'Avanzado',
      icon: Settings,
      description: 'Configuración avanzada'
    }
  ]

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await updateProfile(profileData)
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Las contraseñas no coinciden')
      return
    }

    setIsLoading(true)
    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      console.error('Error changing password:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotificationChange = (key, value) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleWhatsAppSettingChange = (key, value) => {
    setWhatsappSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const exportData = () => {
    const data = {
      profile: profileData,
      notifications: notificationSettings,
      whatsapp: whatsappSettings,
      exportDate: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `whatsapp-hub-settings-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const importData = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          if (data.profile) setProfileData(data.profile)
          if (data.notifications) setNotificationSettings(data.notifications)
          if (data.whatsapp) setWhatsappSettings(data.whatsapp)
          alert('Configuración importada correctamente')
        } catch (error) {
          alert('Error al importar la configuración')
        }
      }
      reader.readAsText(file)
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Información Personal
              </h3>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      className="input"
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      className="input"
                      placeholder="tu@email.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      className="input"
                      placeholder="+51 999 999 999"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Empresa
                    </label>
                    <input
                      type="text"
                      value={profileData.company}
                      onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                      className="input"
                      placeholder="Nombre de tu empresa"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Biografía
                  </label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    className="input"
                    placeholder="Cuéntanos un poco sobre ti..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex items-center gap-2"
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" color="white" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Guardar Cambios
                </button>
              </form>
            </div>
          </div>
        )

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Preferencias de Notificaciones
              </h3>
              
              <div className="space-y-4">
                {[
                  {
                    key: 'emailNotifications',
                    title: 'Notificaciones por Email',
                    description: 'Recibir notificaciones importantes por correo'
                  },
                  {
                    key: 'pushNotifications',
                    title: 'Notificaciones Push',
                    description: 'Notificaciones en tiempo real en el navegador'
                  },
                  {
                    key: 'messageNotifications',
                    title: 'Notificaciones de Mensajes',
                    description: 'Alertas cuando lleguen nuevos mensajes'
                  },
                  {
                    key: 'soundEnabled',
                    title: 'Sonidos',
                    description: 'Reproducir sonidos para las notificaciones'
                  },
                  {
                    key: 'weeklyReports',
                    title: 'Reportes Semanales',
                    description: 'Resumen semanal de actividad por email'
                  },
                  {
                    key: 'maintenanceAlerts',
                    title: 'Alertas de Mantenimiento',
                    description: 'Notificar sobre mantenimientos programados'
                  },
                  {
                    key: 'newFeatures',
                    title: 'Nuevas Características',
                    description: 'Avisos sobre nuevas funcionalidades'
                  }
                ].map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {setting.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {setting.description}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings[setting.key]}
                        onChange={(e) => handleNotificationChange(setting.key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'whatsapp':
        return (
          <div className="space-y-6">
            {/* Estado de conexión */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Estado de Conexión
                </h3>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                  isConnected 
                    ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200'
                    : 'bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-200'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success-500' : 'bg-error-500'}`} />
                  <span className="text-sm font-medium">
                    {isConnected ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={restartSession}
                  className="btn-secondary flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reiniciar Sesión
                </button>
                <button
                  onClick={closeSession}
                  className="btn-danger flex items-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  Cerrar Sesión
                </button>
              </div>
            </div>

            {/* Configuración de WhatsApp */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Configuración de Mensajería
              </h3>
              
              <div className="space-y-4">
                {[
                  {
                    key: 'autoReply',
                    title: 'Respuesta Automática',
                    description: 'Activar respuestas automáticas con IA'
                  },
                  {
                    key: 'readReceipts',
                    title: 'Confirmaciones de Lectura',
                    description: 'Mostrar cuando los mensajes han sido leídos'
                  },
                  {
                    key: 'typingIndicator',
                    title: 'Indicador de Escritura',
                    description: 'Mostrar cuando estás escribiendo'
                  },
                  {
                    key: 'onlineStatus',
                    title: 'Estado en Línea',
                    description: 'Mostrar tu estado de conexión'
                  }
                ].map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {setting.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {setting.description}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={whatsappSettings[setting.key]}
                        onChange={(e) => handleWhatsAppSettingChange(setting.key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-whatsapp-300 dark:peer-focus:ring-whatsapp-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-whatsapp-600"></div>
                    </label>
                  </div>
                ))}

                {/* Configuraciones numéricas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Retraso entre mensajes (segundos)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={whatsappSettings.messageDelay}
                      onChange={(e) => handleWhatsAppSettingChange('messageDelay', parseInt(e.target.value))}
                      className="input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Retraso en envío masivo (segundos)
                    </label>
                    <input
                      type="number"
                      min="3"
                      max="30"
                      value={whatsappSettings.bulkMessageDelay}
                      onChange={(e) => handleWhatsAppSettingChange('bulkMessageDelay', parseInt(e.target.value))}
                      className="input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Máximo mensajes diarios
                    </label>
                    <input
                      type="number"
                      min="100"
                      max="5000"
                      value={whatsappSettings.maxDailyMessages}
                      onChange={(e) => handleWhatsAppSettingChange('maxDailyMessages', parseInt(e.target.value))}
                      className="input"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Cambiar Contraseña
              </h3>
              
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contraseña actual
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="input pr-10"
                      placeholder="Tu contraseña actual"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="input pr-10"
                      placeholder="Tu nueva contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirmar nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="input pr-10"
                      placeholder="Confirma tu nueva contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  className="btn-primary flex items-center gap-2"
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" color="white" />
                  ) : (
                    <Key className="w-4 h-4" />
                  )}
                  Cambiar Contraseña
                </button>
              </form>
            </div>

            {/* Información de seguridad */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    Consejos de Seguridad
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1">
                    <li>• Usa una contraseña de al menos 8 caracteres</li>
                    <li>• Incluye mayúsculas, minúsculas, números y símbolos</li>
                    <li>• No compartas tu contraseña con nadie</li>
                    <li>• Cambia tu contraseña regularmente</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Tema de la Aplicación
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    key: 'light',
                    name: 'Claro',
                    description: 'Tema claro para uso durante el día',
                    icon: Sun,
                    action: setLightTheme
                  },
                  {
                    key: 'dark',
                    name: 'Oscuro',
                    description: 'Tema oscuro para reducir fatiga visual',
                    icon: Moon,
                    action: setDarkTheme
                  },
                  {
                    key: 'system',
                    name: 'Sistema',
                    description: 'Seguir la preferencia del sistema',
                    icon: Monitor,
                    action: setSystemTheme
                  }
                ].map((themeOption) => (
                  <button
                    key={themeOption.key}
                    onClick={themeOption.action}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      (themeOption.key === 'system' && theme === window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') ||
                      theme === themeOption.key
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <themeOption.icon className={`w-5 h-5 ${
                        theme === themeOption.key
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`} />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {themeOption.name}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {themeOption.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview del tema */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Vista Previa
              </h4>
              <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-whatsapp-500 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white">
                      WhatsApp Hub
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Aplicación de ejemplo
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded"></div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'advanced':
        return (
          <div className="space-y-6">
            {/* Exportar/Importar configuración */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Respaldo de Configuración
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={exportData}
                  className="btn-secondary flex items-center justify-center gap-2 p-4"
                >
                  <Download className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Exportar Configuración</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Descargar archivo de respaldo
                    </div>
                  </div>
                </button>

                <label className="btn-secondary flex items-center justify-center gap-2 p-4 cursor-pointer">
                  <Upload className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Importar Configuración</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Cargar archivo de respaldo
                    </div>
                  </div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Información del sistema */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Información del Sistema
              </h3>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Versión:</span>
                  <span className="font-medium text-gray-900 dark:text-white">2.1.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Última actualización:</span>
                  <span className="font-medium text-gray-900 dark:text-white">Hace 2 días</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Navegador:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                     navigator.userAgent.includes('Firefox') ? 'Firefox' : 
                     navigator.userAgent.includes('Safari') ? 'Safari' : 'Otro'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Soporte:</span>
                  <span className="font-medium text-success-600 dark:text-success-400">Compatible</span>
                </div>
              </div>
            </div>

            {/* Zona de peligro */}
            <div className="border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="text-lg font-medium text-red-900 dark:text-red-100 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Zona de Peligro
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">
                    Reiniciar Configuración
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                    Esto restaurará todas las configuraciones a sus valores predeterminados.
                  </p>
                  <button className="btn-danger flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Reiniciar Configuración
                  </button>
                </div>

                <div>
                  <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">
                    Eliminar Cuenta
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                    Esta acción eliminará permanentemente tu cuenta y todos los datos asociados.
                  </p>
                  <button className="btn-danger flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Eliminar Cuenta
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Configuración
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Personaliza tu experiencia
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar de navegación */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left p-4 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <tab.icon className={`w-5 h-5 ${
                      activeTab === tab.id 
                        ? 'text-primary-600 dark:text-primary-400' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`} />
                    <div>
                      <div className="font-medium">{tab.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {tab.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Contenido principal */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="card p-6"
            >
              {renderTabContent()}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage