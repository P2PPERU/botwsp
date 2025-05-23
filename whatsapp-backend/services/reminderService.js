const Client = require('../models/Client');
const whatsappService = require('../services/whatsappWebService');
const logger = require('../utils/logger');
const messageTemplates = require('../utils/messageTemplates');

class ReminderService {
  constructor() {
    this.isRunning = false;
    this.lastRun = null;
  }

  // Función principal para verificar y enviar recordatorios
  async checkAndSendReminders() {
    if (this.isRunning) {
      logger.warn('Reminder check already running, skipping...');
      return;
    }

    this.isRunning = true;
    logger.info('🔍 Iniciando verificación de recordatorios...');

    try {
      const today = new Date();
      const stats = {
        checked: 0,
        sent: 0,
        failed: 0,
        skipped: 0
      };

      // Obtener todos los clientes activos y próximos a vencer
      const clients = await Client.findAll();
      stats.checked = clients.length;

      logger.info(`Verificando ${clients.length} clientes...`);

      for (const client of clients) {
        try {
          const daysToExpiry = this.calculateDaysToExpiry(client.expiry);
          
          // Solo enviar recordatorios en días específicos
          if (this.shouldSendReminder(daysToExpiry, client)) {
            await this.sendReminder(client, daysToExpiry);
            stats.sent++;
            
            // Actualizar el estado del cliente si es necesario
            await this.updateClientStatus(client, daysToExpiry);
            
            // Delay entre mensajes para evitar spam
            await this.delay(2000);
          } else {
            stats.skipped++;
          }
        } catch (error) {
          logger.error(`Error processing client ${client.name}:`, error.message);
          stats.failed++;
        }
      }

      this.lastRun = new Date();
      
      logger.success(`✅ Verificación completada:`, {
        checked: stats.checked,
        sent: stats.sent,
        failed: stats.failed,
        skipped: stats.skipped
      });

      return stats;
    } catch (error) {
      logger.error('Error in reminder check:', error.message);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  // Enviar recordatorio individual
  async sendReminder(client, daysToExpiry) {
    try {
      const message = this.generateReminderMessage(client, daysToExpiry);
      
      // Usar whatsapp-web.js en lugar de wppClient
      const response = await whatsappService.sendMessage(client.phone, message);

      // Registrar el envío
      await this.logReminderSent(client, daysToExpiry, message);

      logger.success(`📨 Recordatorio enviado a ${client.name} (${client.phone})`);
      
      return response;
    } catch (error) {
      logger.error(`❌ Error enviando recordatorio a ${client.name}:`, error.message);
      throw error;
    }
  }

  // Enviar recordatorio personalizado
  async sendCustomReminder(clientId, message, scheduleFor = null) {
    try {
      const client = await Client.findById(clientId);
      if (!client) {
        throw new Error('Client not found');
      }

      if (scheduleFor && new Date(scheduleFor) > new Date()) {
        // Programar para el futuro (implementar cola de trabajos)
        logger.info(`Recordatorio programado para ${client.name} el ${scheduleFor}`);
        return { scheduled: true, scheduleFor };
      }

      // Usar whatsapp-web.js
      const response = await whatsappService.sendMessage(client.phone, message);

      await this.logReminderSent(client, null, message, 'custom');

      logger.success(`📨 Recordatorio personalizado enviado a ${client.name}`);
      
      return response;
    } catch (error) {
      logger.error('Error sending custom reminder:', error.message);
      throw error;
    }
  }

  // Enviar recordatorios masivos a clientes específicos
  async sendBulkReminders(clientIds, messageTemplate, delay = 2000) {
    const results = {
      sent: 0,
      failed: 0,
      errors: []
    };

    for (const clientId of clientIds) {
      try {
        const client = await Client.findById(clientId);
        if (!client) {
          results.errors.push({ clientId, error: 'Client not found' });
          continue;
        }

        const message = this.personalizeMessage(messageTemplate, client);
        
        // Usar whatsapp-web.js
        await whatsappService.sendMessage(client.phone, message);

        await this.logReminderSent(client, null, message, 'bulk');
        results.sent++;

        logger.info(`Bulk reminder sent to ${client.name}`);
        
        if (delay > 0) {
          await this.delay(delay);
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ clientId, error: error.message });
        logger.error(`Failed to send bulk reminder to client ${clientId}:`, error.message);
      }
    }

    logger.success(`Bulk reminders completed: ${results.sent} sent, ${results.failed} failed`);
    return results;
  }

  // Generar mensaje de recordatorio personalizado
  generateReminderMessage(client, daysToExpiry) {
    const templates = messageTemplates.getReminders();
    let template;

    if (daysToExpiry <= 0) {
      template = templates.expired;
    } else if (daysToExpiry === 1) {
      template = templates.lastDay;
    } else if (daysToExpiry === 2) {
      template = templates.twoDays;
    } else if (daysToExpiry === 3) {
      template = templates.threeDays;
    } else {
      template = templates.general;
    }

    return this.personalizeMessage(template, client, daysToExpiry);
  }

  // Personalizar mensaje con datos del cliente
  personalizeMessage(template, client, daysToExpiry = null) {
    return template
      .replace(/\{name\}/g, client.name)
      .replace(/\{service\}/g, client.service)
      .replace(/\{plan\}/g, client.plan || 'Estándar')
      .replace(/\{expiry\}/g, client.expiry)
      .replace(/\{days\}/g, daysToExpiry)
      .replace(/\{phone\}/g, client.phone);
  }

  // Determinar si se debe enviar recordatorio
  shouldSendReminder(daysToExpiry, client) {
    // No enviar si está suspendido
    if (client.status === 'suspended') {
      return false;
    }

    // Enviar en días específicos: 3, 2, 1, 0 (vencido)
    const reminderDays = [3, 2, 1, 0];
    return reminderDays.includes(daysToExpiry);
  }

  // Calcular días hasta el vencimiento
  calculateDaysToExpiry(expiryDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    
    return Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
  }

  // Actualizar estado del cliente basado en días de vencimiento
  async updateClientStatus(client, daysToExpiry) {
    let newStatus = client.status;

    if (daysToExpiry < 0) {
      newStatus = 'expired';
    } else if (daysToExpiry <= 3) {
      newStatus = 'expiring';
    } else if (client.status === 'expiring' && daysToExpiry > 3) {
      newStatus = 'active';
    }

    if (newStatus !== client.status) {
      await Client.update(client.id, { status: newStatus });
      logger.info(`Cliente ${client.name} status actualizado a: ${newStatus}`);
    }
  }

  // Registrar recordatorio enviado
  async logReminderSent(client, daysToExpiry, message, type = 'automatic') {
    const logEntry = {
      clientId: client.id,
      clientName: client.name,
      phone: client.phone,
      daysToExpiry: daysToExpiry,
      message: message,
      type: type,
      sentAt: new Date().toISOString()
    };

    // Aquí podrías guardar en base de datos o archivo
    logger.info('Reminder logged:', logEntry);
  }

  // Obtener estadísticas de recordatorios
  async getStats(days = 30) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    // Aquí implementarías las consultas a tu base de datos de logs
    return {
      totalSent: 0,
      successRate: 0,
      byType: {
        automatic: 0,
        custom: 0,
        bulk: 0
      },
      lastRun: this.lastRun,
      isRunning: this.isRunning
    };
  }

  // Verificar próximos vencimientos
  async getUpcomingExpirations(days = 7) {
    const clients = await Client.findExpiring(days);
    
    return clients.map(client => ({
      ...client,
      daysToExpiry: this.calculateDaysToExpiry(client.expiry),
      needsReminder: this.shouldSendReminder(this.calculateDaysToExpiry(client.expiry), client)
    }));
  }

  // Función auxiliar para delay
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Validar configuración antes de enviar
  async validateConfiguration() {
    try {
      // Verificar conexión con whatsapp-web.js
      const status = await whatsappService.checkConnection();
      
      if (!status.connected) {
        throw new Error('WhatsApp Web session not connected');
      }

      logger.success('✅ Reminder service configuration validated');
      return true;
    } catch (error) {
      logger.error('❌ Reminder service configuration invalid:', error.message);
      throw error;
    }
  }
}

module.exports = new ReminderService();