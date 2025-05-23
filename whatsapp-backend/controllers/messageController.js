const whatsappService = require('../services/whatsappWebService');
const logger = require('../utils/logger');
const Message = require('../models/Message');

class MessageController {
  // Enviar mensaje simple
  async sendMessage(req, res) {
    try {
      const { phone, message, type = 'text' } = req.body;
      
      // Validaciones
      if (!phone || !message) {
        return res.status(400).json({
          success: false,
          error: 'Phone and message are required'
        });
      }

      // Formatear número de teléfono
      const formattedPhone = whatsappService.formatPhoneNumber(phone);
      
      // Enviar mensaje usando whatsapp-web.js
      const response = await whatsappService.sendMessage(formattedPhone, message);

      // Guardar mensaje en base de datos
      const newMessage = new Message({
        from: 'streaming-bot',
        to: formattedPhone,
        message: message,
        type: type,
        status: 'sent',
        fromMe: true
      });
      
      await newMessage.save();

      logger.success(`Message sent to ${formattedPhone}`, { messageId: newMessage.id });
      
      res.json({
        success: true,
        data: {
          messageId: newMessage.id,
          wppResponse: response,
          message: newMessage
        }
      });
    } catch (error) {
      logger.error('Error sending message:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to send message',
        details: error.message
      });
    }
  }

  // Enviar mensaje con archivo
  async sendFile(req, res) {
    try {
      const { phone, file, caption, filename } = req.body;
      
      if (!phone || !file) {
        return res.status(400).json({
          success: false,
          error: 'Phone and file are required'
        });
      }

      const formattedPhone = whatsappService.formatPhoneNumber(phone);
      
      // Enviar archivo usando whatsapp-web.js
      const response = await whatsappService.sendFile(
        formattedPhone, 
        file, 
        filename, 
        caption
      );

      // Guardar mensaje en base de datos
      const newMessage = new Message({
        from: 'streaming-bot',
        to: formattedPhone,
        message: caption || 'File sent',
        type: 'file',
        status: 'sent',
        fromMe: true,
        fileData: { filename, hasFile: true }
      });
      
      await newMessage.save();

      logger.success(`File sent to ${formattedPhone}`, { filename });
      
      res.json({
        success: true,
        data: {
          messageId: newMessage.id,
          wppResponse: response
        }
      });
    } catch (error) {
      logger.error('Error sending file:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to send file',
        details: error.message
      });
    }
  }

  // Enviar mensaje masivo
  async sendBulkMessage(req, res) {
    try {
      const { phones, message, delay = 2000 } = req.body;
      
      if (!phones || !Array.isArray(phones) || !message) {
        return res.status(400).json({
          success: false,
          error: 'Phones array and message are required'
        });
      }

      const results = [];
      
      for (const phone of phones) {
        try {
          const formattedPhone = whatsappService.formatPhoneNumber(phone);
          
          // Enviar mensaje usando whatsapp-web.js
          const response = await whatsappService.sendMessage(formattedPhone, message);

          // Guardar mensaje
          const newMessage = new Message({
            from: 'streaming-bot',
            to: formattedPhone,
            message: message,
            type: 'text',
            status: 'sent',
            fromMe: true,
            bulkId: req.body.bulkId || Date.now().toString()
          });
          
          await newMessage.save();

          results.push({
            phone: formattedPhone,
            success: true,
            messageId: newMessage.id
          });

          logger.info(`Bulk message sent to ${formattedPhone}`);
          
          // Delay entre mensajes para evitar spam
          if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        } catch (error) {
          results.push({
            phone: phone,
            success: false,
            error: error.message
          });
          logger.error(`Failed to send bulk message to ${phone}:`, error.message);
        }
      }

      const successCount = results.filter(r => r.success).length;
      logger.success(`Bulk message completed: ${successCount}/${phones.length} sent`);
      
      res.json({
        success: true,
        data: {
          totalSent: successCount,
          totalFailed: phones.length - successCount,
          results: results
        }
      });
    } catch (error) {
      logger.error('Error in bulk message:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to send bulk messages',
        details: error.message
      });
    }
  }

  // Obtener historial de mensajes
  async getHistory(req, res) {
    try {
      const { 
        page = 1, 
        limit = 50, 
        phone, 
        type, 
        fromDate, 
        toDate 
      } = req.query;

      const filters = {};
      
      if (phone) {
        const formattedPhone = whatsappService.formatPhoneNumber(phone);
        filters.$or = [
          { from: formattedPhone },
          { to: formattedPhone }
        ];
      }
      
      if (type) {
        filters.type = type;
      }
      
      if (fromDate || toDate) {
        filters.timestamp = {};
        if (fromDate) filters.timestamp.$gte = new Date(fromDate);
        if (toDate) filters.timestamp.$lte = new Date(toDate);
      }

      const messages = await Message.find(filters, page, limit);
      const total = await Message.count(filters);
      
      res.json({
        success: true,
        data: {
          messages: messages,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Error getting message history:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get message history',
        details: error.message
      });
    }
  }

  // Marcar mensajes como leídos
  async markAsRead(req, res) {
    try {
      const { messageIds } = req.body;
      
      if (!messageIds || !Array.isArray(messageIds)) {
        return res.status(400).json({
          success: false,
          error: 'Message IDs array is required'
        });
      }

      await Message.updateMany(
        { id: { $in: messageIds } },
        { status: 'read', readAt: new Date() }
      );

      logger.info(`Marked ${messageIds.length} messages as read`);
      
      res.json({
        success: true,
        data: {
          markedCount: messageIds.length
        }
      });
    } catch (error) {
      logger.error('Error marking messages as read:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to mark messages as read',
        details: error.message
      });
    }
  }

  // Obtener estadísticas de mensajes
  async getStats(req, res) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const stats = {
        total: await Message.count({}),
        today: await Message.count({
          timestamp: { $gte: today, $lt: tomorrow }
        }),
        sent: await Message.count({ fromMe: true }),
        received: await Message.count({ fromMe: false }),
        byType: {
          text: await Message.count({ type: 'text' }),
          file: await Message.count({ type: 'file' }),
          image: await Message.count({ type: 'image' })
        },
        byStatus: {
          sent: await Message.count({ status: 'sent' }),
          delivered: await Message.count({ status: 'delivered' }),
          read: await Message.count({ status: 'read' }),
          failed: await Message.count({ status: 'failed' })
        }
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting message stats:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get message stats',
        details: error.message
      });
    }
  }

  // Eliminar mensaje
  async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;
      
      const deleted = await Message.delete(messageId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Message not found'
        });
      }

      logger.info(`Message ${messageId} deleted`);
      
      res.json({
        success: true,
        data: {
          deletedId: messageId
        }
      });
    } catch (error) {
      logger.error('Error deleting message:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to delete message',
        details: error.message
      });
    }
  }
}

module.exports = new MessageController();