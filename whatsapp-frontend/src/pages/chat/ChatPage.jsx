import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Paperclip, 
  Smile, 
  Search,
  MoreVertical,
  Phone,
  Video,
  Info,
  ArrowLeft,
  Check,
  CheckCheck,
  Clock,
  Image,
  File,
  Mic,
  Plus,
  X
} from 'lucide-react'
import { useWhatsApp } from '@context/WhatsAppContext'
import LoadingSpinner from '@components/ui/LoadingSpinner'

const ChatPage = () => {
  const { 
    isConnected, 
    sendMessage, 
    conversations, 
    selectedConversation, 
    selectConversation,
    generateConversations,
    isLoading 
  } = useWhatsApp()
  
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isMobileView, setIsMobileView] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showAttachments, setShowAttachments] = useState(false)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  // Simular conversaciones para demo
  const [demoConversations] = useState([
    {
      id: '51987654321',
      contact: '51987654321',
      name: 'María González',
      lastMessage: {
        message: '¡Hola! ¿Tienen disponibilidad para hoy?',
        timestamp: Date.now() - 300000,
        fromMe: false
      },
      unreadCount: 2,
      avatar: null,
      isOnline: true
    },
    {
      id: '51876543210',
      contact: '51876543210', 
      name: 'Carlos Ruiz',
      lastMessage: {
        message: 'Perfecto, muchas gracias por la información',
        timestamp: Date.now() - 600000,
        fromMe: true
      },
      unreadCount: 0,
      avatar: null,
      isOnline: false
    },
    {
      id: '51765432109',
      contact: '51765432109',
      name: 'Ana Silva', 
      lastMessage: {
        message: '¿Cuál es el precio del servicio premium?',
        timestamp: Date.now() - 1800000,
        fromMe: false
      },
      unreadCount: 1,
      avatar: null,
      isOnline: true
    },
    {
      id: '51654321098',
      contact: '51654321098',
      name: 'Roberto López',
      lastMessage: {
        message: 'De acuerdo, nos vemos mañana a las 3 PM',
        timestamp: Date.now() - 3600000,
        fromMe: false
      },
      unreadCount: 0,
      avatar: null,
      isOnline: false
    },
    {
      id: '51543210987',
      contact: '51543210987',
      name: 'Patricia Morales',
      lastMessage: {
        message: 'Documento adjunto enviado ✓',
        timestamp: Date.now() - 7200000,
        fromMe: true
      },
      unreadCount: 3,
      avatar: null,
      isOnline: true
    }
  ])

  // Mensajes demo para la conversación seleccionada
  const [demoMessages, setDemoMessages] = useState([
    {
      id: 1,
      message: '¡Hola! ¿Tienen disponibilidad para hoy?',
      timestamp: Date.now() - 300000,
      fromMe: false,
      status: 'delivered',
      type: 'text'
    },
    {
      id: 2,
      message: 'Hola María! Sí, tenemos disponibilidad. ¿En qué horario te acomoda?',
      timestamp: Date.now() - 240000,
      fromMe: true,
      status: 'read',
      type: 'text'
    },
    {
      id: 3,
      message: 'Perfecto, ¿podrían ser a las 3 PM?',
      timestamp: Date.now() - 180000,
      fromMe: false,
      status: 'delivered',
      type: 'text'
    },
    {
      id: 4,
      message: 'Excelente, confirmado para las 3 PM. Te enviaré la dirección por aquí.',
      timestamp: Date.now() - 120000,
      fromMe: true,
      status: 'read',
      type: 'text'
    },
    {
      id: 5,
      message: '¡Muchas gracias! 😊',
      timestamp: Date.now() - 60000,
      fromMe: false,
      status: 'delivered',
      type: 'text'
    }
  ])

  const emojis = ['😊', '👍', '❤️', '😂', '🙏', '🎉', '👌', '🔥', '💪', '✨']

  useEffect(() => {
    scrollToBottom()
  }, [demoMessages])

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768)
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!message.trim() || !selectedConversation) return

    const newMessage = {
      id: Date.now(),
      message: message.trim(),
      timestamp: Date.now(),
      fromMe: true,
      status: 'sending',
      type: 'text'
    }

    // Agregar mensaje optimista
    setDemoMessages(prev => [...prev, newMessage])
    setMessage('')
    
    try {
      setIsTyping(true)
      
      if (isConnected) {
        await sendMessage(selectedConversation.contact, message)
        // Actualizar status a enviado
        setDemoMessages(prev => 
          prev.map(msg => 
            msg.id === newMessage.id 
              ? { ...msg, status: 'sent' }
              : msg
          )
        )
      } else {
        // Simular envío en modo demo
        setTimeout(() => {
          setDemoMessages(prev => 
            prev.map(msg => 
              msg.id === newMessage.id 
                ? { ...msg, status: 'delivered' }
                : msg
            )
          )
        }, 1000)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Marcar como error
      setDemoMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'error' }
            : msg
        )
      )
    } finally {
      setIsTyping(false)
    }
  }

  const handleEmojiClick = (emoji) => {
    setMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
  }

  const handleFileUpload = (type) => {
    setShowAttachments(false)
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'image' ? 'image/*' : '*/*'
      fileInputRef.current.click()
    }
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatLastMessageTime = (timestamp) => {
    const now = new Date()
    const messageTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60))

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h`
    } else {
      return messageTime.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
    }
  }

  const getMessageStatusIcon = (status) => {
    switch (status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-gray-400" />
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />
      case 'error':
        return <X className="w-3 h-3 text-red-500" />
      default:
        return null
    }
  }

  const filteredConversations = demoConversations.filter(conv =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.contact.includes(searchTerm)
  )

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-warning-100 dark:bg-warning-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-warning-600 dark:text-warning-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            WhatsApp no conectado
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Conecta WhatsApp desde el dashboard para usar el chat
          </p>
          <button className="btn-primary">
            Ir al Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar de conversaciones */}
      <div className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col ${
        isMobileView ? (selectedConversation ? 'hidden' : 'w-full') : 'w-80'
      }`}>
        {/* Header del sidebar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Conversaciones
          </h1>
          
          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar conversaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 transition-all"
            />
          </div>
        </div>

        {/* Lista de conversaciones */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {filteredConversations.length > 0 ? (
            <div className="space-y-1 p-2">
              {filteredConversations.map((conversation, index) => (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => selectConversation(conversation)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    selectedConversation?.id === conversation.id
                      ? 'bg-whatsapp-50 dark:bg-whatsapp-900/20 border border-whatsapp-200 dark:border-whatsapp-800 shadow-sm'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-sm font-medium text-white">
                          {conversation.name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2)}
                        </span>
                      </div>
                      {conversation.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                      )}
                    </div>

                    {/* Info de la conversación */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {conversation.name}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatLastMessageTime(conversation.lastMessage.timestamp)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">
                          {conversation.lastMessage.fromMe && (
                            <span className="mr-1">
                              {getMessageStatusIcon('read')}
                            </span>
                          )}
                          {conversation.lastMessage.message}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="ml-2 bg-whatsapp-500 text-white text-xs rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No se encontraron conversaciones</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Panel de chat */}
      <div className={`flex-1 flex flex-col ${
        isMobileView && !selectedConversation ? 'hidden' : ''
      }`}>
        {selectedConversation ? (
          <>
            {/* Header del chat */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isMobileView && (
                    <button
                      onClick={() => selectConversation(null)}
                      className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                  )}
                  
                  {/* Avatar y nombre */}
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {selectedConversation.name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2)}
                      </span>
                    </div>
                    {selectedConversation.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success-500 border border-white dark:border-gray-800 rounded-full"></div>
                    )}
                  </div>
                  
                  <div>
                    <h2 className="font-medium text-gray-900 dark:text-white">
                      {selectedConversation.name}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedConversation.isOnline ? 'En línea' : 'Desconectado'}
                    </p>
                  </div>
                </div>

                {/* Acciones del chat */}
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <Phone className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <Video className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <Info className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900 scrollbar-thin">
              <AnimatePresence>
                {demoMessages.map((msg, index) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl relative ${
                      msg.fromMe 
                        ? 'bg-whatsapp-500 text-white rounded-br-sm shadow-lg' 
                        : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-bl-sm shadow-sm'
                    }`}>
                      <p className="text-sm break-words">{msg.message}</p>
                      <div className={`flex items-center gap-1 mt-1 ${
                        msg.fromMe ? 'justify-end' : 'justify-start'
                      }`}>
                        <span className={`text-xs ${
                          msg.fromMe ? 'text-whatsapp-100' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {formatTime(msg.timestamp)}
                        </span>
                        {msg.fromMe && getMessageStatusIcon(msg.status)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl rounded-bl-sm px-4 py-2 shadow-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input de mensaje */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
              <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                {/* Botón de adjuntos */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAttachments(!showAttachments)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>

                  {/* Menu de adjuntos */}
                  <AnimatePresence>
                    {showAttachments && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-2 min-w-[150px]"
                      >
                        <button
                          type="button"
                          onClick={() => handleFileUpload('image')}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2"
                        >
                          <Image className="w-4 h-4" />
                          Imagen
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFileUpload('file')}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2"
                        >
                          <File className="w-4 h-4" />
                          Archivo
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Input de texto */}
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="w-full px-4 py-2 pr-10 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all"
                    disabled={isTyping}
                  />
                  
                  {/* Botón de emoji */}
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded"
                    >
                      <Smile className="w-4 h-4" />
                    </button>

                    {/* Picker de emojis */}
                    <AnimatePresence>
                      {showEmojiPicker && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-3"
                        >
                          <div className="grid grid-cols-5 gap-2">
                            {emojis.map((emoji, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => handleEmojiClick(emoji)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-lg transition-colors"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Botón de enviar */}
                <button
                  type="submit"
                  disabled={!message.trim() || isTyping}
                  className="p-2 bg-whatsapp-500 text-white rounded-lg hover:bg-whatsapp-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                >
                  {isTyping ? (
                    <LoadingSpinner size="sm" color="white" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          /* Panel vacío cuando no hay conversación seleccionada */
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <div className="w-16 h-16 bg-whatsapp-100 dark:bg-whatsapp-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-whatsapp-600 dark:text-whatsapp-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                WhatsApp Hub
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Selecciona una conversación para comenzar a chatear
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Input file oculto */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files[0]
          if (file) {
            console.log('File selected:', file.name)
            // Aquí manejarías la subida del archivo
          }
        }}
      />
    </div>
  )
}

export default ChatPage