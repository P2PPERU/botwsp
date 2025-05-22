const logger = require('../utils/logger');

class ValidationMiddleware {
  
  // Validar ID numérico
  validateId(req, res, next) {
    const { id } = req.params;
    
    if (!id || isNaN(id) || parseInt(id) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID parameter',
        details: 'ID must be a positive number'
      });
    }
    
    req.params.id = parseInt(id);
    next();
  }

  // Validar datos de cliente
  validateClient(req, res, next) {
    const { name, phone, service } = req.body;
    const errors = [];

    // Validar nombre
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      errors.push('Name is required and must be at least 2 characters');
    }

    // Validar teléfono
    if (!phone || typeof phone !== 'string') {
      errors.push('Phone is required');
    } else {
      const phoneRegex = /^[0-9+\-\s\(\)]{8,15}$/;
      if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        errors.push('Invalid phone number format');
      }
    }

    // Validar servicio
    if (!service || typeof service !== 'string' || service.trim().length < 2) {
      errors.push('Service is required and must be at least 2 characters');
    }

    // Validar fecha de vencimiento si existe
    if (req.body.expiry) {
      const expiryDate = new Date(req.body.expiry);
      if (isNaN(expiryDate.getTime())) {
        errors.push('Invalid expiry date format');
      }
    }

    // Validar plan si existe
    if (req.body.plan && typeof req.body.plan !== 'string') {
      errors.push('Plan must be a string');
    }

    // Validar estado si existe
    if (req.body.status) {
      const validStatuses = ['active', 'expiring', 'expired', 'suspended'];
      if (!validStatuses.includes(req.body.status)) {
        errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    // Limpiar y formatear datos
    req.body.name = name.trim();
    req.body.phone = phone.replace(/\s/g, '');
    req.body.service = service.trim();
    
    if (req.body.plan) {
      req.body.plan = req.body.plan.trim();
    }

    next();
  }

  // Validar actualización de cliente
  validateClientUpdate(req, res, next) {
    const errors = [];
    const { name, phone, service, expiry, plan, status } = req.body;

    // Validar nombre si existe
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        errors.push('Name must be at least 2 characters');
      } else {
        req.body.name = name.trim();
      }
    }

    // Validar teléfono si existe
    if (phone !== undefined) {
      if (typeof phone !== 'string') {
        errors.push('Phone must be a string');
      } else {
        const phoneRegex = /^[0-9+\-\s\(\)]{8,15}$/;
        if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
          errors.push('Invalid phone number format');
        } else {
          req.body.phone = phone.replace(/\s/g, '');
        }
      }
    }

    // Validar servicio si existe
    if (service !== undefined) {
      if (typeof service !== 'string' || service.trim().length < 2) {
        errors.push('Service must be at least 2 characters');
      } else {
        req.body.service = service.trim();
      }
    }

    // Validar fecha de vencimiento si existe
    if (expiry !== undefined) {
      const expiryDate = new Date(expiry);
      if (isNaN(expiryDate.getTime())) {
        errors.push('Invalid expiry date format');
      }
    }

    // Validar plan si existe
    if (plan !== undefined && typeof plan !== 'string') {
      errors.push('Plan must be a string');
    }

    // Validar estado si existe
    if (status !== undefined) {
      const validStatuses = ['active', 'expiring', 'expired', 'suspended'];
      if (!validStatuses.includes(status)) {
        errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  }

  // Validar mensaje
  validateMessage(req, res, next) {
    const { phone, message } = req.body;
    const errors = [];

    // Validar teléfono
    if (!phone || typeof phone !== 'string') {
      errors.push('Phone is required');
    } else {
      const phoneRegex = /^[0-9+\-\s\(\)@c.us]{8,20}$/;
      if (!phoneRegex.test(phone)) {
        errors.push('Invalid phone number format');
      }
    }

    // Validar mensaje
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      errors.push('Message is required and cannot be empty');
    } else if (message.length > 4096) {
      errors.push('Message too long (max 4096 characters)');
    }

    // Validar tipo si existe
    if (req.body.type) {
      const validTypes = ['text', 'image', 'file', 'audio', 'video'];
      if (!validTypes.includes(req.body.type)) {
        errors.push(`Type must be one of: ${validTypes.join(', ')}`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    req.body.message = message.trim();
    next();
  }

  // Validar mensaje con archivo
  validateFileMessage(req, res, next) {
    const { phone, file } = req.body;
    const errors = [];

    // Validar teléfono
    if (!phone || typeof phone !== 'string') {
      errors.push('Phone is required');
    }

    // Validar archivo base64
    if (!file || typeof file !== 'string') {
      errors.push('File (base64) is required');
    } else {
      // Verificar que sea base64 válido
      const base64Regex = /^[A-Za-z0-9+/]+=*$/;
      if (!base64Regex.test(file.replace(/^data:[^;]+;base64,/, ''))) {
        errors.push('Invalid base64 file format');
      }
    }

    // Validar nombre de archivo si existe
    if (req.body.filename && typeof req.body.filename !== 'string') {
      errors.push('Filename must be a string');
    }

    // Validar caption si existe
    if (req.body.caption && typeof req.body.caption !== 'string') {
      errors.push('Caption must be a string');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  }

  // Validar mensaje masivo
  validateBulkMessage(req, res, next) {
    const { phones, message } = req.body;
    const errors = [];

    // Validar array de teléfonos
    if (!phones || !Array.isArray(phones) || phones.length === 0) {
      errors.push('Phones array is required and cannot be empty');
    } else {
      // Validar cada teléfono
      for (let i = 0; i < phones.length; i++) {
        if (typeof phones[i] !== 'string') {
          errors.push(`Phone at index ${i} must be a string`);
        }
      }
      
      // Limitar cantidad de números
      if (phones.length > 100) {
        errors.push('Maximum 100 phone numbers allowed per bulk message');
      }
    }

    // Validar mensaje
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      errors.push('Message is required and cannot be empty');
    }

    // Validar delay si existe
    if (req.body.delay !== undefined) {
      const delay = parseInt(req.body.delay);
      if (isNaN(delay) || delay < 0 || delay > 10000) {
        errors.push('Delay must be a number between 0 and 10000 milliseconds');
      } else {
        req.body.delay = delay;
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    req.body.message = message.trim();
    next();
  }

  // Validar marcar como leído
  validateMarkAsRead(req, res, next) {
    const { messageIds } = req.body;
    const errors = [];

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      errors.push('MessageIds array is required and cannot be empty');
    } else {
      // Validar cada ID
      for (let i = 0; i < messageIds.length; i++) {
        if (typeof messageIds[i] !== 'string' || messageIds[i].trim().length === 0) {
          errors.push(`Message ID at index ${i} must be a non-empty string`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  }

  // Validar renovación de suscripción
  validateRenewal(req, res, next) {
    const errors = [];
    const { months, newExpiry } = req.body;

    if (months !== undefined && newExpiry !== undefined) {
      errors.push('Cannot specify both months and newExpiry');
    }

    if (months !== undefined) {
      const monthsNum = parseInt(months);
      if (isNaN(monthsNum) || monthsNum < 1 || monthsNum > 12) {
        errors.push('Months must be a number between 1 and 12');
      } else {
        req.body.months = monthsNum;
      }
    }

    if (newExpiry !== undefined) {
      const expiryDate = new Date(newExpiry);
      if (isNaN(expiryDate.getTime())) {
        errors.push('Invalid newExpiry date format');
      } else if (expiryDate <= new Date()) {
        errors.push('newExpiry must be a future date');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  }

  // Validar suspensión
  validateSuspension(req, res, next) {
    const { reason } = req.body;
    const errors = [];

    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      errors.push('Suspension reason is required and must be at least 5 characters');
    } else {
      req.body.reason = reason.trim();
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  }

  // Validar importación de clientes
  validateImport(req, res, next) {
    const { clients } = req.body;
    const errors = [];

    if (!clients || !Array.isArray(clients) || clients.length === 0) {
      errors.push('Clients array is required and cannot be empty');
    } else {
      // Limitar cantidad
      if (clients.length > 500) {
        errors.push('Maximum 500 clients allowed per import');
      }

      // Validar estructura básica de cada cliente
      for (let i = 0; i < Math.min(clients.length, 5); i++) { // Solo validar los primeros 5 para performance
        const client = clients[i];
        if (!client.name || !client.phone || !client.service) {
          errors.push(`Client at index ${i} is missing required fields (name, phone, service)`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  }

  // Middleware de logging para requests válidos
  logValidRequest(req, res, next) {
    logger.info(`Valid request: ${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.method === 'POST' || req.method === 'PUT' ? 'Present' : 'N/A'
    });
    next();
  }

  // Sanitizar entrada de texto
  sanitizeText(text) {
    if (typeof text !== 'string') return text;
    
    return text
      .trim()
      .replace(/[<>]/g, '') // Remover caracteres potencialmente peligrosos
      .substring(0, 1000); // Limitar longitud
  }

  // Validar query parameters para paginación
  validatePagination(req, res, next) {
    const { page = 1, limit = 50 } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    if (isNaN(pageNum) || pageNum < 1) {
      req.query.page = 1;
    } else if (pageNum > 1000) {
      req.query.page = 1000; // Máximo 1000 páginas
    } else {
      req.query.page = pageNum;
    }
    
    if (isNaN(limitNum) || limitNum < 1) {
      req.query.limit = 50;
    } else if (limitNum > 100) {
      req.query.limit = 100; // Máximo 100 elementos por página
    } else {
      req.query.limit = limitNum;
    }
    
    next();
  }
}

const validation = new ValidationMiddleware();

module.exports = {
  validateId: validation.validateId.bind(validation),
  validateClient: validation.validateClient.bind(validation),
  validateClientUpdate: validation.validateClientUpdate.bind(validation),
  validateMessage: validation.validateMessage.bind(validation),
  validateFileMessage: validation.validateFileMessage.bind(validation),
  validateBulkMessage: validation.validateBulkMessage.bind(validation),
  validateMarkAsRead: validation.validateMarkAsRead.bind(validation),
  validateRenewal: validation.validateRenewal.bind(validation),
  validateSuspension: validation.validateSuspension.bind(validation),
  validateImport: validation.validateImport.bind(validation),
  logValidRequest: validation.logValidRequest.bind(validation),
  validatePagination: validation.validatePagination.bind(validation),
  sanitizeText: validation.sanitizeText.bind(validation)
};