import { createContext, useContext, useReducer, useEffect } from 'react'
import { authAPI } from '@services/api'
import toast from 'react-hot-toast'

// Estado inicial
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
}

// Función segura para localStorage - MEJORADA
const safeLocalStorage = {
  getItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(key) || null
      }
      return null
    } catch (error) {
      console.warn('localStorage getItem failed:', error)
      return null
    }
  },
  setItem: (key, value) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value)
        return true
      }
      return false
    } catch (error) {
      console.warn('localStorage setItem failed:', error)
      return false
    }
  },
  removeItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key)
        return true
      }
      return false
    } catch (error) {
      console.warn('localStorage removeItem failed:', error)
      return false
    }
  }
}

// Reducer para manejar el estado
const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null
      }
    
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      }
    
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      }
    
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      }
    
    case 'AUTH_CLEAR_ERROR':
      return {
        ...state,
        error: null
      }
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      }
    
    default:
      return state
  }
}

// Crear el contexto
const AuthContext = createContext()

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Provider del contexto
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    ...initialState,
    token: safeLocalStorage.getItem('token')
  })

  // Verificar token al cargar la aplicación
  useEffect(() => {
    const verifyToken = async () => {
      const token = safeLocalStorage.getItem('token')
      
      if (!token) {
        dispatch({ type: 'SET_LOADING', payload: false })
        return
      }

      try {
        console.log('🔐 Verificando token guardado...')
        const response = await authAPI.verify()
        
        // Tu backend devuelve diferentes estructuras, vamos a manejar todas
        let userData = null
        
        if (response.data.success && response.data.data) {
          // Si viene en formato { success: true, data: { user: ... } }
          userData = response.data.data.user || response.data.data
        } else if (response.data.user) {
          // Si viene directo { user: ... }
          userData = response.data.user
        } else {
          // Si viene directo los datos del usuario
          userData = response.data
        }
        
        console.log('✅ Token verificado, usuario:', userData)
        
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: userData,
            token: token
          }
        })
      } catch (error) {
        console.error('❌ Token verification failed:', error)
        safeLocalStorage.removeItem('token')
        safeLocalStorage.removeItem('refreshToken')
        dispatch({ type: 'AUTH_ERROR', payload: 'Session expired' })
      }
    }

    verifyToken()
  }, [])

  // Login
  const login = async (credentials) => {
    try {
      dispatch({ type: 'AUTH_START' })
      
      console.log('🔐 Intentando login con:', credentials.email)
      
      const response = await authAPI.login(credentials)
      
      console.log('📦 Respuesta del backend:', response.data)
      
      // Tu backend puede devolver diferentes estructuras
      let token = null
      let userData = null
      let refreshToken = null
      
      if (response.data.success && response.data.data) {
        // Formato: { success: true, data: { token, user, refreshToken } }
        token = response.data.data.token
        userData = response.data.data.user
        refreshToken = response.data.data.refreshToken
      } else {
        // Formato directo: { token, user, refreshToken }
        token = response.data.token
        userData = response.data.user
        refreshToken = response.data.refreshToken
      }
      
      if (!token) {
        throw new Error('No se recibió token del servidor')
      }
      
      if (!userData) {
        throw new Error('No se recibieron datos del usuario')
      }
      
      console.log('✅ Login exitoso:', { user: userData, hasToken: !!token })
      
      // Guardar tokens en localStorage usando función segura
      safeLocalStorage.setItem('token', token)
      if (refreshToken) {
        safeLocalStorage.setItem('refreshToken', refreshToken)
      }
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: userData, token }
      })
      
      toast.success(`¡Bienvenido ${userData.name || userData.email}!`)
      return response.data
      
    } catch (error) {
      console.error('❌ Login error:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Error al iniciar sesión'
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage })
      toast.error(errorMessage)
      throw error
    }
  }

  // Logout
  const logout = async () => {
    try {
      console.log('🚪 Cerrando sesión...')
      // Intentar logout en el backend
      await authAPI.logout()
    } catch (error) {
      console.error('Error en logout del backend:', error)
    } finally {
      // Limpiar localStorage y estado
      safeLocalStorage.removeItem('token')
      safeLocalStorage.removeItem('refreshToken')
      dispatch({ type: 'AUTH_LOGOUT' })
      toast.success('Sesión cerrada correctamente')
      console.log('✅ Sesión cerrada')
    }
  }

  // Actualizar perfil
  const updateProfile = async (profileData) => {
    try {
      console.log('👤 Actualizando perfil:', profileData)
      const response = await authAPI.updateProfile(profileData)
      
      let updatedUser = null
      if (response.data.success && response.data.data) {
        updatedUser = response.data.data.user || response.data.data
      } else {
        updatedUser = response.data.user || response.data
      }
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: updatedUser,
          token: state.token
        }
      })
      
      toast.success('Perfil actualizado correctamente')
      console.log('✅ Perfil actualizado')
      return response.data
    } catch (error) {
      console.error('❌ Error actualizando perfil:', error)
      const errorMessage = error.response?.data?.error || 'Error al actualizar perfil'
      toast.error(errorMessage)
      throw error
    }
  }

  // Cambiar contraseña
  const changePassword = async (passwordData) => {
    try {
      console.log('🔑 Cambiando contraseña...')
      await authAPI.changePassword(passwordData)
      toast.success('Contraseña cambiada correctamente')
      console.log('✅ Contraseña cambiada')
    } catch (error) {
      console.error('❌ Error cambiando contraseña:', error)
      const errorMessage = error.response?.data?.error || 'Error al cambiar contraseña'
      toast.error(errorMessage)
      throw error
    }
  }

  // Limpiar errores
  const clearError = () => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' })
  }

  // Verificar permisos - adaptado a tu backend
  const hasPermission = (resource, action) => {
    if (!state.user || !state.user.permissions) return false
    const resourcePermissions = state.user.permissions[resource]
    if (!resourcePermissions) return false
    return resourcePermissions.includes(action)
  }

  // Verificar rol - adaptado a tu backend
  const hasRole = (roles) => {
    if (!state.user) return false
    if (typeof roles === 'string') {
      return state.user.role === roles
    }
    return roles.includes(state.user.role)
  }

  // Verificar si es admin
  const isAdmin = () => {
    return hasRole('admin')
  }

  const value = {
    // Estado
    ...state,
    
    // Acciones
    login,
    logout,
    updateProfile,
    changePassword,
    clearError,
    
    // Utilities
    hasPermission,
    hasRole,
    isAdmin
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}