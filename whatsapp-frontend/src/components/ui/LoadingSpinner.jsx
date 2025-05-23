import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary', 
  fullScreen = false,
  text,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  const colorClasses = {
    primary: 'text-primary-600',
    whatsapp: 'text-whatsapp-500',
    white: 'text-white',
    gray: 'text-gray-500'
  }

  const SpinnerComponent = () => (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
        className="relative"
      >
        <Loader2 className={`${sizeClasses[size]} ${colorClasses[color]}`} />
      </motion.div>
      
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-gray-600 dark:text-gray-400 font-medium"
        >
          {text}
        </motion.p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex items-center justify-center"
      >
        <SpinnerComponent />
      </motion.div>
    )
  }

  return <SpinnerComponent />
}

export default LoadingSpinner