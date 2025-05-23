import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, MessageCircle, Shield, Zap } from 'lucide-react'
import { useAuth } from '@context/AuthContext'
import LoadingSpinner from '@components/ui/LoadingSpinner'

// Schema de validación
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
})

const LoginPage = () => {
  const { login, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema)
  })

  // Redirigir si ya está autenticado
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/dashboard'
    return <Navigate to={from} replace />
  }

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true)
      await login(data)
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Cargando..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-whatsapp-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Panel izquierdo - Información */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:block space-y-8"
        >
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex items-center gap-3 mb-6 justify-center lg:justify-start"
            >
              <div className="w-12 h-12 bg-whatsapp-500 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                WhatsApp Hub
              </h1>
            </motion.div>
            
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Gestiona tu negocio con
              <span className="text-gradient-whatsapp"> WhatsApp</span>
            </h2>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              La plataforma más avanzada para automatizar y gestionar 
              tu comunicación empresarial en WhatsApp.
            </p>
          </div>

          {/* Características */}
          <div className="space-y-4">
            {[
              {
                icon: MessageCircle,
                title: 'Mensajería Automatizada',
                description: 'Respuestas automáticas con IA avanzada'
              },
              {
                icon: Shield,
                title: 'Seguro y Confiable',
                description: 'Máxima seguridad para tus datos'
              },
              {
                icon: Zap,
                title: 'Rápido y Eficiente',
                description: 'Aumenta tu productividad al máximo'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                className="flex items-start gap-4"
              >
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Panel derecho - Formulario */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="card-premium p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Iniciar Sesión
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Accede a tu cuenta para continuar
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  {...register('email')}
                  type="email"
                  className={`input ${errors.email ? 'input-error' : ''}`}
                  placeholder="tu@ejemplo.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-error-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-error-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Recordar sesión */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Recordar sesión
                  </span>
                </label>
                <a
                  href="#"
                  className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              {/* Botón de login */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full btn-lg"
              >
                {isSubmitting ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ¿No tienes una cuenta?{' '}
                <a
                  href="#"
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
                >
                  Contacta con ventas
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default LoginPage