import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@context/AuthContext'
import { WhatsAppProvider } from '@context/WhatsAppContext'
import { ThemeProvider } from '@context/ThemeContext'
import ProtectedRoute from '@components/common/ProtectedRoute'
import LoadingSpinner from '@components/ui/LoadingSpinner'

// Pages
import LoginPage from '@pages/auth/LoginPage'
import DashboardPage from '@pages/dashboard/DashboardPage'
import ChatPage from '@pages/chat/ChatPage'
import SettingsPage from '@pages/settings/SettingsPage'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WhatsAppProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Protected Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/chat" 
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </WhatsAppProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App