import axios from 'axios'
import toast from 'react-hot-toast'

// Configuración base de Axios
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Si el error es 401 y no es un retry, intentar refrescar el token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken
          })
          
          const { token } = response.data.data
          localStorage.setItem('token', token)
          
          // Reintentar la petición original
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Si el refresh falla, limpiar el localStorage y redirigir al login
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    // Manejar errores específicos
    if (error.response?.status === 403) {
      toast.error('No tienes permisos para realizar esta acción')
    } else if (error.response?.status === 404) {
      toast.error('Recurso no encontrado')
    } else if (error.response?.status >= 500) {
      toast.error('Error interno del servidor. Intenta nuevamente.')
    }

    return Promise.reject(error)
  }
)

// ================================
// API ENDPOINTS - AUTENTICACIÓN
// ================================
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  verify: () => api.get('/auth/verify'),
  refresh: (data) => api.post('/auth/refresh', data),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.post('/auth/change-password', data),
}

// ================================
// API ENDPOINTS - WHATSAPP
// ================================
export const whatsappAPI = {
  // Sesión
  getStatus: () => api.get('/sessions/status'),
  getQRCode: () => api.get('/sessions/qr'),
  closeSession: () => api.post('/sessions/close'),
  restartSession: () => api.post('/sessions/restart'),
  getSessionInfo: () => api.get('/sessions/info'),

  // Mensajes
  sendMessage: (data) => api.post('/messages/send', data),
  sendFile: (data) => api.post('/messages/send-file', data),
  sendBulkMessage: (data) => api.post('/messages/send-bulk', data),
  getMessages: (params) => api.get('/messages/history', { params }),
  markAsRead: (data) => api.put('/messages/mark-read', data),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
  getMessageStats: () => api.get('/messages/stats'),
}

// ================================
// API ENDPOINTS - CLIENTES
// ================================
export const clientsAPI = {
  getAll: (params) => api.get('/clients', { params }),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
  getExpiring: (params) => api.get('/clients/expiring', { params }),
  renewSubscription: (id, data) => api.post(`/clients/${id}/renew`, data),
  suspend: (id, data) => api.post(`/clients/${id}/suspend`, data),
  reactivate: (id) => api.post(`/clients/${id}/reactivate`),
  importClients: (data) => api.post('/clients/import', data),
}

// ================================
// API ENDPOINTS - GPT/IA
// ================================
export const gptAPI = {
  generateResponse: (data) => api.post('/gpt/generate', data),
  analyzeIntent: (data) => api.post('/gpt/analyze-intent', data),
  enhanceMessage: (data) => api.post('/gpt/enhance-message', data),
  generateSummary: (data) => api.post('/gpt/generate-summary', data),
  getConfig: () => api.get('/gpt/config'),
  healthCheck: () => api.get('/gpt/health'),
}

// ================================
// API ENDPOINTS - MÉTRICAS
// ================================
export const metricsAPI = {
  getSummary: () => api.get('/metrics/summary'),
  getDetailed: () => api.get('/metrics/detailed'),
  getDashboard: () => api.get('/metrics/dashboard'),
  getHourlyActivity: () => api.get('/metrics/hourly'),
  getCosts: () => api.get('/metrics/costs'),
  getErrors: (params) => api.get('/metrics/errors', { params }),
  getSystemStatus: () => api.get('/metrics/system'),
  getHistorical: (params) => api.get('/metrics/historical', { params }),
  exportMetrics: (params) => api.get('/metrics/export', { params }),
}

// ================================
// API ENDPOINTS - USUARIOS
// ================================
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  toggleStatus: (id, data) => api.post(`/users/${id}/toggle-status`, data),
  getActivity: (id, params) => api.get(`/users/${id}/activity`, { params }),
  getPermissions: () => api.get('/users/permissions'),
}

// ================================
// API ENDPOINTS - WORKFLOWS
// ================================
export const workflowsAPI = {
  getActive: () => api.get('/workflows'),
  getDetails: (id) => api.get(`/workflows/${id}`),
  execute: (id, data) => api.post(`/workflows/${id}/execute`, data),
  toggle: (id, data) => api.patch(`/workflows/${id}/toggle`, data),
  getStats: (params) => api.get('/workflows/stats', { params }),
  triggerReminder: (data) => api.post('/workflows/trigger/reminder', data),
  triggerAutoResponse: (data) => api.post('/workflows/trigger/auto-response', data),
  create: (data) => api.post('/workflows/create', data),
  healthCheck: () => api.get('/workflows/health'),
}

// ================================
// API ENDPOINTS - ESTADÍSTICAS
// ================================
export const statsAPI = {
  getGeneral: () => api.get('/stats'),
  getClients: (params) => api.get('/stats/clients', { params }),
  getMessages: (params) => api.get('/stats/messages', { params }),
  getSystem: () => api.get('/stats/system'),
  getDailyReport: (params) => api.get('/stats/daily-report', { params }),
}

// ================================
// UTILIDADES
// ================================

// Función para manejar archivos
export const uploadFile = async (file, endpoint) => {
  const formData = new FormData()
  formData.append('file', file)
  
  return api.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

// Función para descargar archivos
export const downloadFile = async (url, filename) => {
  try {
    const response = await api.get(url, {
      responseType: 'blob',
    })
    
    const blob = new Blob([response.data])
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(downloadUrl)
  } catch (error) {
    toast.error('Error al descargar el archivo')
    throw error
  }
}

// Función para convertir imagen a base64
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = (error) => reject(error)
  })
}

// Health check general
export const healthCheck = () => api.get('/health')

export default api