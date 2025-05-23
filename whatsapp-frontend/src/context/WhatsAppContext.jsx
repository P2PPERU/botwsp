import { createContext, useContext, useReducer, useEffect } from 'react'
import { whatsappAPI } from '@services/api'
import { useAuth } from '@context/AuthContext'
import toast from 'react-hot-toast'

// Estado inicial
const initialState = {
  isConnected: false,
  qrCode: null,
  sessionStatus: 'disconnected', // disconnected, connecting, connected, error
  messages: [],
  conversations: [],
  selectedConversation: null,
  isLoading: false,
  error: null,
  lastCheck: null,
  sessionInfo: null
}

// Reducer para manejar el estado
const whatsappReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      }

    case 'SET_CONNECTION_STATUS':
      return {
        ...state,
        isConnected: action.payload.connected,
        sessionStatus: action.payload.status,
        lastCheck: action.payload.lastCheck,
        error: action.payload.connected ? null : state.error
      }

    case 'SET_QR_CODE':
      return {
        ...state,
        qrCode: action.payload,
        sessionStatus: action.payload ? 'connecting' : state.sessionStatus
      }

    case 'SET_SESSION_INFO':
      return {
        ...state,
        sessionInfo: action.payload
      }

    case 'SET_MESSAGES':
      return {
        ...state,
        messages: action.payload
      }

    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [action.payload, ...state.messages]
      }

    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.id ? { ...msg, ...action.payload } : msg
        )
      }

    case 'SET_CONVERSATIONS':
      return {
        ...state,
        conversations: action.payload
      }

    case 'SELECT_CONVERSATION':
      return {
        ...state,
        selectedConversation: action.payload
      }

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false
      }

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      }

    case 'RESET_STATE':
      return initialState

    default:
      return state
  }
}

// Crear el contexto
const WhatsAppContext = createContext()

// Hook personalizado para usar el contexto
export const useWhatsApp = () => {
  const context = useContext(WhatsAppContext)
  if (!context) {
    throw new Error('useWhatsApp must be used within a WhatsAppProvider')
  }
  return context
}

// Provider del contexto
export const WhatsAppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(whatsappReducer, initialState)
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  // Solo verificar estado de conexión si está autenticado
  useEffect(() => {
    if (!isAuthenticated || authLoading) {
      // Reset del estado si no está autenticado
      dispatch({ type: 'RESET_STATE' })
      return
    }

    // Verificar inmediatamente
    checkConnectionStatus()
    
    // Configurar intervalo
    const interval = setInterval(() => {
      if (isAuthenticated) {
        checkConnectionStatus()
      }
    }, 30000) // Cada 30 segundos

    return () => clearInterval(interval)
  }, [isAuthenticated, authLoading])

  // Verificar estado de conexión
  const checkConnectionStatus = async () => {
    // Solo ejecutar si está autenticado
    if (!isAuthenticated) {
      console.log('⚠️ Skipping WhatsApp status check - not authenticated')
      return
    }

    try {
      const response = await whatsappAPI.getStatus()
      
      // Tu backend puede devolver diferentes estructuras
      let isConnected = false
      let status = 'disconnected'
      
      if (response.data.success && response.data.data) {
        isConnected = response.data.data.connected || response.data.data.status === 'connected'
        status = response.data.data.sessionStatus || (isConnected ? 'connected' : 'disconnected')
      } else {
        isConnected = response.data.connected || response.data.status === 'connected'
        status = response.data.sessionStatus || (isConnected ? 'connected' : 'disconnected')
      }
      
      console.log('📱 WhatsApp status:', { isConnected, status })
      
      dispatch({
        type: 'SET_CONNECTION_STATUS',
        payload: {
          connected: isConnected,
          status: status,
          lastCheck: new Date().toISOString()
        }
      })
    } catch (error) {
      // Solo loggear errores que no sean de autenticación
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        console.error('Error checking WhatsApp status:', error)
        dispatch({
          type: 'SET_CONNECTION_STATUS',
          payload: {
            connected: false,
            status: 'error',
            lastCheck: new Date().toISOString()
          }
        })
      } else {
        console.log('⚠️ WhatsApp status check failed - authentication required')
      }
    }
  }

  // Obtener código QR
  const getQRCode = async () => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión primero')
      return
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      const response = await whatsappAPI.getQRCode()
      
      let isConnected = false
      let qrCode = null
      
      if (response.data.success && response.data.data) {
        isConnected = response.data.data.connected
        qrCode = response.data.data.qr
      } else {
        isConnected = response.data.connected
        qrCode = response.data.qr
      }
      
      if (isConnected) {
        dispatch({
          type: 'SET_CONNECTION_STATUS',
          payload: {
            connected: true,
            status: 'connected',
            lastCheck: new Date().toISOString()
          }
        })
        dispatch({ type: 'SET_QR_CODE', payload: null })
        toast.success('WhatsApp ya está conectado')
      } else if (qrCode) {
        dispatch({ type: 'SET_QR_CODE', payload: qrCode })
        toast.success('Escanea el código QR con WhatsApp')
      } else {
        toast.info('Generando código QR...')
        // Reintentar en 3 segundos
        setTimeout(() => getQRCode(), 3000)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error al obtener código QR'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      toast.error(errorMessage)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  // Cerrar sesión de WhatsApp
  const closeSession = async () => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión primero')
      return
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      await whatsappAPI.closeSession()
      
      dispatch({
        type: 'SET_CONNECTION_STATUS',
        payload: {
          connected: false,
          status: 'disconnected',
          lastCheck: new Date().toISOString()
        }
      })
      dispatch({ type: 'SET_QR_CODE', payload: null })
      dispatch({ type: 'SET_SESSION_INFO', payload: null })
      
      toast.success('Sesión de WhatsApp cerrada')
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error al cerrar sesión'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      toast.error(errorMessage)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  // Reiniciar sesión
  const restartSession = async () => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión primero')
      return
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      await whatsappAPI.restartSession()
      
      dispatch({
        type: 'SET_CONNECTION_STATUS',
        payload: {
          connected: false,
          status: 'connecting',
          lastCheck: new Date().toISOString()
        }
      })
      
      toast.success('Reiniciando sesión de WhatsApp...')
      
      // Obtener nuevo QR después de 3 segundos
      setTimeout(() => getQRCode(), 3000)
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error al reiniciar sesión'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      toast.error(errorMessage)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  // Iniciar sesión
  const startSession = async () => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión primero')
      return
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      await whatsappAPI.startSession()
      
      dispatch({
        type: 'SET_CONNECTION_STATUS',
        payload: {
          connected: false,
          status: 'connecting',
          lastCheck: new Date().toISOString()
        }
      })
      
      toast.success('Iniciando sesión de WhatsApp...')
      
      // Obtener QR después de 2 segundos
      setTimeout(() => getQRCode(), 2000)
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error al iniciar sesión'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      toast.error(errorMessage)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  // Obtener información de la sesión
  const getSessionInfo = async () => {
    if (!isAuthenticated) return null

    try {
      const response = await whatsappAPI.getSessionInfo()
      const sessionInfo = response.data.success ? response.data.data : response.data
      dispatch({ type: 'SET_SESSION_INFO', payload: sessionInfo })
      return sessionInfo
    } catch (error) {
      console.error('Error getting session info:', error)
      return null
    }
  }

  // Enviar mensaje
  const sendMessage = async (phone, message, type = 'text') => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión primero')
      return
    }

    try {
      const response = await whatsappAPI.sendMessage({ 
        phone, 
        message, 
        type 
      })
      
      const messageData = response.data.success ? response.data.data : response.data
      
      const newMessage = {
        id: messageData.messageId || Date.now(),
        from: 'me',
        to: phone,
        message,
        type,
        status: 'sent',
        timestamp: Date.now(),
        fromMe: true
      }
      
      dispatch({ type: 'ADD_MESSAGE', payload: newMessage })
      
      toast.success('Mensaje enviado')
      return messageData
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error al enviar mensaje'
      toast.error(errorMessage)
      throw error
    }
  }

  // Enviar mensaje masivo
  const sendBulkMessage = async (phones, message, delay = 2000) => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión primero')
      return
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      const response = await whatsappAPI.sendBulkMessage({
        phones,
        message,
        delay
      })
      
      toast.success(`Enviando mensajes a ${phones.length} contactos...`)
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error al enviar mensajes masivos'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      toast.error(errorMessage)
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  // Obtener historial de mensajes
  const getMessages = async (filters = {}) => {
    if (!isAuthenticated) return null

    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      const response = await whatsappAPI.getMessages(filters)
      
      const messages = response.data.success ? 
        response.data.data.messages || response.data.data : 
        response.data.messages || response.data
      
      dispatch({ type: 'SET_MESSAGES', payload: messages })
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error al obtener mensajes'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      toast.error(errorMessage)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  // Obtener estadísticas de mensajes
  const getMessageStats = async () => {
    if (!isAuthenticated) return null

    try {
      const response = await whatsappAPI.getMessageStats()
      return response.data.success ? response.data.data : response.data
    } catch (error) {
      console.error('Error getting message stats:', error)
      return null
    }
  }

  // Generar lista de conversaciones
  const generateConversations = () => {
    const conversationMap = new Map()
    
    state.messages.forEach(message => {
      const contact = message.fromMe ? message.to : message.from
      const cleanContact = contact.replace('@c.us', '')
      
      if (!conversationMap.has(cleanContact)) {
        conversationMap.set(cleanContact, {
          id: cleanContact,
          contact: cleanContact,
          name: cleanContact, // En un futuro, obtener nombre del contacto
          lastMessage: message,
          unreadCount: message.fromMe ? 0 : 1,
          timestamp: message.timestamp
        })
      } else {
        const conversation = conversationMap.get(cleanContact)
        if (message.timestamp > conversation.timestamp) {
          conversation.lastMessage = message
          conversation.timestamp = message.timestamp
        }
        if (!message.fromMe) {
          conversation.unreadCount += 1
        }
      }
    })
    
    const conversations = Array.from(conversationMap.values())
      .sort((a, b) => b.timestamp - a.timestamp)
    
    dispatch({ type: 'SET_CONVERSATIONS', payload: conversations })
    return conversations
  }

  // Seleccionar conversación
  const selectConversation = (conversation) => {
    dispatch({ type: 'SELECT_CONVERSATION', payload: conversation })
  }

  // Limpiar errores
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const value = {
    // Estado
    ...state,
    
    // Acciones de conexión
    checkConnectionStatus,
    getQRCode,
    closeSession,
    restartSession,
    startSession,
    getSessionInfo,
    
    // Acciones de mensajes
    sendMessage,
    sendBulkMessage,
    getMessages,
    getMessageStats,
    
    // Acciones de conversaciones
    generateConversations,
    selectConversation,
    
    // Utilities
    clearError
  }

  return (
    <WhatsAppContext.Provider value={value}>
      {children}
    </WhatsAppContext.Provider>
  )
}