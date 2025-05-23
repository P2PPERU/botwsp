const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const Message = require('../models/Message');
const Client = require('../models/Client');
const gptService = require('../services/gptService');
const whatsappService = require('../services/whatsappWebService');

// ============================================
// WEBHOOK PARA N8N - RESULTADOS DE WORKFLOWS
// ============================================
router.post('/n8n-result', async (req, res) => {
  try {
    const { workflowId, executionId, status, data, error } = req.body;
    
    logger.info('N8N workflow result received:', {
      workflowId,
      executionId,
      status
    });

    // Procesar resultado según el tipo de workflow
    if (data && data.workflowType) {
      switch (data.workflowType) {
        case 'reminder':
          await processReminderResult(data);
          break;
        case 'auto_response':
          await processAutoResponseResult(data);
          break;
        case 'backup':
          await processBackupResult(data);
          break;
        default:
          logger.info(`Unknown workflow type: ${data.workflowType}`);
      }
    }

    res.status(200).json({ success: true, processed: true });

  } catch (error) {
    logger.error('Error processing N8N webhook:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// WEBHOOK PARA NOTIFICACIONES EXTERNAS
// ============================================
router.post('/external', async (req, res) => {
  try {
    const { source, type, data, timestamp } = req.body;
    
    logger.info('External webhook received:', {
      source,
      type,
      timestamp: timestamp || new Date().toISOString()
    });

    // Procesar según la fuente
    switch (source) {
      case 'payment_system':
        await processPaymentNotification(data);
        break;
      
      case 'google_sheets':
        await processGoogleSheetsUpdate(data);
        break;
      
      case 'backup_system':
        await processBackupNotification(data);
        break;
      
      default:
        logger.info(`Unknown webhook source: ${source}`);
    }

    res.status(200).json({ 
      success: true, 
      message: `Webhook from ${source} processed` 
    });

  } catch (error) {
    logger.error('Error processing external webhook:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// WEBHOOK DE TEST PARA DESARROLLO
// ============================================
router.post('/test', async (req, res) => {
  try {
    logger.info('Test webhook called with data:', req.body);
    
    // Simular procesamiento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    res.json({
      success: true,
      message: 'Test webhook processed successfully',
      received: req.body,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error in test webhook:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// HEALTH CHECK PARA WEBHOOKS
// ============================================
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    webhooks: {
      n8n_result: '/webhook/n8n-result',
      external: '/webhook/external',
      test: '/webhook/test'
    },
    timestamp: new Date().toISOString()
  });
});

// ============================================
// FUNCIONES AUXILIARES
// ============================================

// Procesar resultado de recordatorio de n8n
async function processReminderResult(data) {
  try {
    const { clientId, status, error, messageId } = data;
    
    if (status === 'success') {
      logger.success(`Reminder sent successfully to client ${clientId}`);
      
      // Actualizar estado del cliente si es necesario
      if (clientId) {
        logger.info(`Updated reminder status for client ${clientId}`);
      }
    } else {
      logger.error(`Reminder failed for client ${clientId}:`, error);
    }

  } catch (error) {
    logger.error('Error processing reminder result:', error.message);
  }
}

// Procesar resultado de respuesta automática
async function processAutoResponseResult(data) {
  try {
    const { phone, originalMessage, response, status } = data;
    
    if (status === 'success') {
      logger.success(`Auto-response processed for ${phone}`);
    } else {
      logger.error(`Auto-response failed for ${phone}`);
    }

  } catch (error) {
    logger.error('Error processing auto-response result:', error.message);
  }
}

// Procesar resultado de backup
async function processBackupResult(data) {
  try {
    const { type, status, timestamp, size } = data;
    
    if (status === 'success') {
      logger.success(`Backup completed: ${type} (${size})`);
    } else {
      logger.error(`Backup failed: ${type}`);
    }

  } catch (error) {
    logger.error('Error processing backup result:', error.message);
  }
}

// Procesar notificación de pago
async function processPaymentNotification(data) {
  try {
    const { clientId, amount, status, paymentId } = data;
    
    if (status === 'approved') {
      // Buscar y actualizar cliente
      const client = await Client.findById(clientId);
      if (client) {
        // Calcular nueva fecha de vencimiento
        const newExpiry = new Date();
        newExpiry.setMonth(newExpiry.getMonth() + 1);
        
        await Client.update(clientId, {
          status: 'active',
          lastPayment: new Date().toISOString().split('T')[0],
          expiry: newExpiry.toISOString().split('T')[0]
        });
        
        logger.success(`Payment processed for client ${clientId}: $${amount}`);
        
        // Enviar confirmación por WhatsApp
        const confirmationMessage = `✅ ¡Pago confirmado!\n\nGracias ${client.name}, tu suscripción de ${client.service} ha sido renovada hasta el ${newExpiry.toLocaleDateString()}.`;
        
        await whatsappService.sendMessage(client.phone, confirmationMessage);
      }
    }

  } catch (error) {
    logger.error('Error processing payment notification:', error.message);
  }
}

// Procesar actualización de Google Sheets
async function processGoogleSheetsUpdate(data) {
  try {
    const { action, rowData, sheetName } = data;
    
    if (action === 'client_updated' && rowData) {
      // Sincronizar datos del cliente desde Google Sheets
      const clientData = {
        name: rowData.name,
        phone: rowData.phone,
        service: rowData.service,
        plan: rowData.plan,
        expiry: rowData.expiry,
        status: rowData.status
      };
      
      // Buscar cliente existente o crear nuevo
      let client = await Client.findByPhone(clientData.phone);
      if (client) {
        await Client.update(client.id, clientData);
        logger.info(`Client updated from Google Sheets: ${clientData.name}`);
      } else {
        const newClient = new Client(clientData);
        await newClient.save();
        logger.info(`New client created from Google Sheets: ${clientData.name}`);
      }
    }

  } catch (error) {
    logger.error('Error processing Google Sheets update:', error.message);
  }
}

// Procesar notificación de backup
async function processBackupNotification(data) {
  try {
    const { status, files, timestamp } = data;
    
    if (status === 'completed') {
      logger.success(`Backup completed successfully: ${files.length} files`);
    } else {
      logger.error('Backup failed:', data.error);
    }

  } catch (error) {
    logger.error('Error processing backup notification:', error.message);
  }
}

module.exports = router;