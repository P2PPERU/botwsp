import { createContext, useContext, useReducer, useEffect } from 'react'
import { authAPI } from '@services/api'
import toast from 'react-hot-toast'

// Estado inicial
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: true,
  error: null
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
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Verificar token al cargar la aplicación
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token')
      
      if (!token) {
        dispatch({ type: 'SET_LOADING', payload: false })
        return
      }

      try {
        const response = await authAPI.verify()
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: response.data.user,
            token: token
          }
        })
      } catch (error) {
        console.error('Token verification failed:', error)
        localStorage.removeItem('token')
        dispatch({ type: 'AUTH_ERROR', payload: 'Session expired' })
      }
    }

    verifyToken()
  }, [])

  // Login
  const login = async (credentials) => {
    try {
      dispatch({ type: 'AUTH_START' })
      
      const response = await authAPI.login(credentials)
      const { token, user } = response.data
      
      // Guardar token en localStorage
      localStorage.setItem('token', token)
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token }
      })
      
      toast.success(`¡Bienvenido ${user.name}!`)
      return response.data
      
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error al iniciar sesión'
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage })
      toast.error(errorMessage)
      throw error
    }
  }

  // Logout
  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      dispatch({ type: 'AUTH_LOGOUT' })
      toast.success('Sesión cerrada correctamente')
    }
  }

  // Refresh token
  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) throw new Error('No refresh token')

      const response = await authAPI.refresh({ refreshToken })
      const { token, user } = response.data
      
      localStorage.setItem('token', token)
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token }
      })
      
      return response.data
    } catch (error) {
      console.error('Token refresh failed:', error)
      logout()
      throw error
    }
  }

  // Actualizar perfil
  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData)
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.data.user,
          token: state.token
        }
      })
      
      toast.success('Perfil actualizado correctamente')
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error al actualizar perfil'
      toast.error(errorMessage)
      throw error
    }
  }

  // Cambiar contraseña
  const changePassword = async (passwordData) => {
    try {
      await authAPI.changePassword(passwordData)
      toast.success('Contraseña cambiada correctamente')
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error al cambiar contraseña'
      toast.error(errorMessage)
      throw error
    }
  }

  // Limpiar errores
  const clearError = () => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' })
  }

  // Verificar permisos
  const hasPermission = (resource, action) => {
    if (!state.user || !state.user.permissions) return false
    return state.user.permissions[resource]?.includes(action) || false
  }

  // Verificar rol
  const hasRole = (role) => {
    if (!state.user) return false
    return state.user.role === role
  }

  const value = {
    // Estado
    ...state,
    
    // Acciones
    login,
    logout,
    refreshToken,
    updateProfile,
    changePassword,
    clearError,
    
    // Utilities
    hasPermission,
    hasRole
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}