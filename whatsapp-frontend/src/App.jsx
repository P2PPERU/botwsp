import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from '@context/AuthContext'
import { WhatsAppProvider } from '@context/WhatsAppContext'
import { ThemeProvider } from '@context/ThemeContext'
import ProtectedRoute from '@components/common/ProtectedRoute'


// Pages
import LoginPage from '@pages/auth/LoginPage'
import DashboardPage from '@pages/dashboard/DashboardPage'
import ChatPage from '@pages/chat/ChatPage'
import SettingsPage from '@pages/settings/SettingsPage'

// Componente de Layout principal
const MainLayout = ({ children }) => {
  const location = useLocation()
  
  // No mostrar layout en login
  if (location.pathname === '/login') {
    return children
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {children}
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WhatsAppProvider>
          <MainLayout>
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
          </MainLayout>
        </WhatsAppProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App