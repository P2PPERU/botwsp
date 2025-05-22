const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const Message = require('../models/Message');
const Client = require('../models/Client');
const gptService = require('../services/gptService');
const wppService = require('../services/wppService');

// Webhook principal de WPPConnect para mensajes entrantes
router.post('/wppconnect', async (req, res) => {
  try {
    const { type, body, from, fromMe, timestamp, session } = req.body;
    
    logger.info('Webhook WPPConnect received:', {
      type,
      from,
      fromMe,
      session
    });

    // Solo procesar mensajes entrantes (no enviados por nosotros)
    if (!fromMe && type === 'chat' && body) {
      // Guardar mensaje en base de datos
      const newMessage = new Message({
        from: from,
        to: session,
        message: body,
        type: 'text',
        status: 'received',
        fromMe: false,
        timestamp: timestamp || Date.now()
      });
      
      await newMessage.save();

      // Buscar cliente por teléfono
      const cleanPhone = wppService.extractCleanNumber(from);
      const client = await Client.findByPhone(cleanPhone);

      // Procesar respuesta automática si está habilitada
      if (process.env.AUTO_RESPONSE_ENABLED === 'true') {
        await processAutoResponse(from, body, client, session);
      }

      // Log del mensaje recibido
      logger.success(`Message received and saved from ${from}`);
    }

    res.status(200).json({ success: true, received: true });

  } catch (error) {
    logger.error('Error processing WPPConnect webhook:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Webhook para n8n - Resultados de workflows
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

// Webhook para notificaciones de estado de WPPConnect
router.post('/wppconnect-status', async (req, res) => {
  try {
    const { session, status, event, data } = req.body;
    
    logger.info('WPPConnect status update:', {
      session,
      status,
      event
    });

    // Procesar diferentes eventos de estado
    switch (event) {
      case 'qrcode':
        logger.info(`QR Code generated for session ${session}`);
        // Aquí podrías guardar el QR code o notificar al frontend
        break;
      
      case 'connected':
        logger.success(`Session ${session} connected successfully`);
        break;
      
      case 'disconnected':
        logger.warn(`Session ${session} disconnected`);
        // Intentar reconectar automáticamente
        setTimeout(() => {
          wppService.restartSession().catch(error => {
            logger.error('Auto-restart failed:', error.message);
          });
        }, 5000);
        break;
      
      case 'error':
        logger.error(`Session ${session} error:`, data);
        break;
    }

    res.status(200).json({ success: true, event: event });

  } catch (error) {
    logger.error('Error processing WPPConnect status webhook:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Webhook genérico para notificaciones externas
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

// Webhook de test para desarrollo
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

// Health check para webhooks
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    webhooks: {
      wppconnect: '/webhook/wppconnect',
      n8n_result: '/webhook/n8n-result',
      status: '/webhook/wppconnect-status',
      external: '/webhook/external',
      test: '/webhook/test'
    },
    timestamp: new Date().toISOString()
  });
});

// Funciones auxiliares para procesar diferentes tipos de webhooks

async function processAutoResponse(from, message, client, session) {
  try {
    // Generar contexto para GPT
    const context = client ? {
      name: client.name,
      service: client.service,
      plan: client.plan,
      status: client.status,
      expiry: client.expiry
    } : null;

    // Generar respuesta con GPT
    const gptResponse = await gptService.generateResponse(message, context);
    
    if (gptResponse && gptResponse.trim().length > 0) {
      // Enviar respuesta automática
      await wppService.sendMessage(from, gptResponse);
      
      // Guardar respuesta en base de datos
      const responseMessage = new Message({
        from: session,
        to: from,
        message: gptResponse,
        type: 'text',
        status: 'sent',
        fromMe: true,
        timestamp: Date.now()
      });
      
      await responseMessage.save();
      
      logger.success(`Auto-response sent to ${from}`);
    }

  } catch (error) {
    logger.error('Error in auto-response:', error.message);
  }
}

async function processReminderResult(data) {
  try {
    const { clientId, status, error, messageId } = data;
    
    if (status === 'success') {
      logger.success(`Reminder sent successfully to client ${clientId}`);
      
      // Actualizar estado del cliente si es necesario
      if (clientId) {
        // Aquí podrías actualizar el último recordatorio enviado
        logger.info(`Updated reminder status for client ${clientId}`);
      }
    } else {
      logger.error(`Reminder failed for client ${clientId}:`, error);
    }

  } catch (error) {
    logger.error('Error processing reminder result:', error.message);
  }
}

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
        
        await wppService.sendMessage(client.phone, confirmationMessage);
      }
    }

  } catch (error) {
    logger.error('Error processing payment notification:', error.message);
  }
}

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