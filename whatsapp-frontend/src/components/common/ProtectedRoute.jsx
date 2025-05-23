import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'
import LoadingSpinner from '@components/ui/LoadingSpinner'

const ProtectedRoute = ({ children, requiredRole, requiredPermission }) => {
  const { isAuthenticated, isLoading, user, hasRole, hasPermission } = useAuth()
  const location = useLocation()

  // Mostrar spinner mientras carga la autenticación
  if (isLoading) {
    return (
      <LoadingSpinner 
        fullScreen 
        text="Verificando autenticación..." 
        size="lg"
      />
    )
  }

  // Redirigir al login si no está autenticado
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    )
  }

  // Verificar rol requerido
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-4">
            <div className="mx-auto w-16 h-16 bg-error-100 dark:bg-error-900 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-error-600 dark:text-error-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Acceso Denegado
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No tienes el rol necesario para acceder a esta página.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Rol requerido: <span className="font-semibold">{requiredRole}</span>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Tu rol actual: <span className="font-semibold">{user?.role}</span>
          </p>
        </div>
      </div>
    )
  }

  // Verificar permisos requeridos
  if (requiredPermission) {
    const [resource, action] = requiredPermission.split(':')
    if (!hasPermission(resource, action)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 bg-warning-100 dark:bg-warning-900 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-warning-600 dark:text-warning-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Permisos Insuficientes
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No tienes los permisos necesarios para acceder a esta página.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Permiso requerido: <span className="font-semibold">{requiredPermission}</span>
            </p>
          </div>
        </div>
      )
    }
  }

  // Si todo está bien, renderizar el contenido
  return children
}

export default ProtectedRoute