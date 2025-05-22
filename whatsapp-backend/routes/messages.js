const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const validation = require('../middleware/validation');

// POST /api/messages/send - Enviar mensaje simple
router.post('/send', 
  validation.validateMessage,
  messageController.sendMessage
);

// POST /api/messages/send-file - Enviar archivo
router.post('/send-file', 
  validation.validateFileMessage,
  messageController.sendFile
);

// POST /api/messages/send-bulk - Enviar mensaje masivo
router.post('/send-bulk', 
  validation.validateBulkMessage,
  messageController.sendBulkMessage
);

// GET /api/messages/history - Obtener historial de mensajes
router.get('/history', messageController.getHistory);

// PUT /api/messages/mark-read - Marcar mensajes como leídos
router.put('/mark-read', 
  validation.validateMarkAsRead,
  messageController.markAsRead
);

// GET /api/messages/stats - Estadísticas de mensajes
router.get('/stats', messageController.getStats);

// DELETE /api/messages/:messageId - Eliminar mensaje
router.delete('/:messageId', messageController.deleteMessage);

module.exports = router;