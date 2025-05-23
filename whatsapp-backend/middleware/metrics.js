const metricsService = require('../services/metricsService');

// Middleware para registrar todas las requests de API
const trackAPIRequests = (req, res, next) => {
  // Ignorar rutas de métricas para evitar loops
  if (req.path.startsWith('/api/metrics')) {
    return next();
  }
  
  const startTime = Date.now();
  
  // Interceptar el método send original
  const originalSend = res.send;
  res.send = function(data) {
    res.send = originalSend;
    
    // Calcular tiempo de respuesta
    const responseTime = Date.now() - startTime;
    
    // Registrar en métricas
    metricsService.recordAPIRequest(
      req.path,
      req.method,
      res.statusCode,
      responseTime
    );
    
    // Si es un error, registrarlo también
    if (res.statusCode >= 400) {
      const errorData = typeof data === 'string' ? data : JSON.parse(data);
      metricsService.recordError(
        'api_error',
        `${req.method} ${req.path} - ${res.statusCode}`,
        {
          path: req.path,
          method: req.method,
          statusCode: res.statusCode,
          error: errorData.error || 'Unknown error'
        }
      );
    }
    
    return res.send(data);
  };
  
  next();
};

// Middleware específico para mensajes
const trackMessages = (type) => {
  return async (req, res, next) => {
    // Guardar referencia al método original
    const originalJson = res.json;
    
    res.json = function(data) {
      // Si la respuesta es exitosa, registrar según el tipo
      if (data.success && type === 'sent') {
        // Se registra en el servicio, no aquí para evitar duplicación
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Middleware para actualizar estadísticas de clientes periódicamente
const updateClientStats = async (req, res, next) => {
  // Solo actualizar en ciertas rutas
  if (req.path.includes('/clients') && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
    const originalJson = res.json;
    
    res.json = async function(data) {
      if (data.success) {
        // Actualizar estadísticas de clientes después de cambios
        try {
          const Client = require('../models/Client');
          const clients = await Client.findAll();
          
          const stats = {
            total: clients.length,
            active: clients.filter(c => c.status === 'active').length,
            expiring: clients.filter(c => c.status === 'expiring').length,
            expired: clients.filter(c => c.status === 'expired').length,
            byService: {}
          };
          
          // Contar por servicio
          clients.forEach(client => {
            const service = client.service || 'Unknown';
            stats.byService[service] = (stats.byService[service] || 0) + 1;
          });
          
          metricsService.updateClientStats(stats);
        } catch (error) {
          console.error('Error updating client stats:', error);
        }
      }
      
      return originalJson.call(this, data);
    };
  }
  
  next();
};

module.exports = {
  trackAPIRequests,
  trackMessages,
  updateClientStats
};