// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

// Verificar token JWT
const verifyToken = async (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided. Please login.'
      });
    }

    // Verificar token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'your-secret-key'
    );

    // Verificar que el usuario aún existe y está activo
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found. Please login again.'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Account suspended. Please contact administrator.'
      });
    }

    // Adjuntar usuario a la request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
      exp: decoded.exp
    };

    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        success: false,
        error: 'Invalid token. Please login again.',
        code: 'INVALID_TOKEN'
      });
    }

    logger.error('Token verification error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Authentication error. Please try again.'
    });
  }
};

// Verificar rol específico
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Access denied for user ${req.user.email} (${req.user.role}) to ${req.method} ${req.path}`);
      
      return res.status(403).json({
        success: false,
        error: 'You do not have the required role to access this resource',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

// Verificar permiso específico
const checkPermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const hasPermission = req.user.permissions?.[resource]?.includes(action);
    
    if (!hasPermission) {
      logger.warn(`Permission denied for user ${req.user.email} - Required: ${resource}:${action}`);
      
      return res.status(403).json({
        success: false,
        error: `You do not have permission to ${action} ${resource}`,
        required: `${resource}:${action}`
      });
    }

    next();
  };
};

// Verificar múltiples permisos (OR)
const checkAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const hasAnyPermission = permissions.some(({ resource, action }) => {
      return req.user.permissions?.[resource]?.includes(action);
    });
    
    if (!hasAnyPermission) {
      logger.warn(`Permission denied for user ${req.user.email} - Required any of: ${JSON.stringify(permissions)}`);
      
      return res.status(403).json({
        success: false,
        error: 'You do not have the required permissions',
        required: permissions
      });
    }

    next();
  };
};

// Middleware opcional - permite acceso sin token pero adjunta user si existe
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;
    
    if (!token) {
      // No hay token, continuar sin usuario
      return next();
    }

    // Intentar verificar token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'your-secret-key'
    );

    const user = await User.findById(decoded.id);
    if (user && user.status === 'active') {
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions
      };
    }

    next();

  } catch (error) {
    // Si hay error, continuar sin usuario
    next();
  }
};

// Rate limiting por usuario
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    if (!req.user) return next();
    
    const userId = req.user.id;
    const now = Date.now();
    
    // Limpiar registros antiguos
    for (const [key, data] of requests.entries()) {
      if (now - data.windowStart > windowMs) {
        requests.delete(key);
      }
    }
    
    // Obtener o crear registro para el usuario
    let userRequests = requests.get(userId);
    if (!userRequests || now - userRequests.windowStart > windowMs) {
      userRequests = {
        count: 0,
        windowStart: now
      };
      requests.set(userId, userRequests);
    }
    
    userRequests.count++;
    
    if (userRequests.count > maxRequests) {
      const resetTime = new Date(userRequests.windowStart + windowMs);
      
      return res.status(429).json({
        success: false,
        error: 'Too many requests',
        resetAt: resetTime.toISOString(),
        limit: maxRequests
      });
    }
    
    // Agregar headers de rate limit
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - userRequests.count);
    res.setHeader('X-RateLimit-Reset', new Date(userRequests.windowStart + windowMs).toISOString());
    
    next();
  };
};

// Logging de acceso para auditoría
const auditLog = async (req, res, next) => {
  if (!req.user) return next();
  
  const startTime = Date.now();
  
  // Capturar la respuesta
  const originalSend = res.send;
  res.send = function(data) {
    res.send = originalSend;
    
    const responseTime = Date.now() - startTime;
    
    // Log de auditoría
    logger.info({
      type: 'AUDIT',
      user: req.user.email,
      role: req.user.role,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    return res.send(data);
  };
  
  next();
};

module.exports = {
  verifyToken,
  checkRole,
  checkPermission,
  checkAnyPermission,
  optionalAuth,
  userRateLimit,
  auditLog
};