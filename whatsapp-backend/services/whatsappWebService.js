const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const Message = require('../models/Message');
const metricsService = require('./metricsService');

class WhatsAppWebService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.lastCheck = null;
    this.qrCodeData = null;
    this.initialize();
  }

  initialize() {
    logger.info('🔄 Initializing WhatsApp Web client...');
    
    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: 'streaming-bot',
        dataPath: path.join(__dirname, '../.wwebjs_auth')
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      }
    });

    this.setupEventHandlers();
    this.client.initialize();
  }

  setupEventHandlers() {
    // QR Code
    this.client.on('qr', async (qr) => {
      logger.info('📱 QR Code received');
      
      // Mostrar en terminal
      qrcodeTerminal.generate(qr, { small: true });
      
      // Guardar como data URL para el endpoint
      this.qrCodeData = await qrcode.toDataURL(qr);
    });

    // Cliente listo
    this.client.on('ready', () => {
      logger.success('✅ WhatsApp Web client is ready!');
      this.isConnected = true;
      this.lastCheck = new Date();
      
      // NUEVO - Registrar conexión exitosa
      metricsService.recordWhatsAppConnection(true);
      metricsService.recordWhatsAppStatus(true);
    });

    // Mensaje recibido
    this.client.on('message', async (msg) => {
      if (!msg.fromMe) {
        await this.handleIncomingMessage(msg);
      }
    });

    // Mensaje enviado
    this.client.on('message_create', async (msg) => {
      if (msg.fromMe) {
        await this.handleOutgoingMessage(msg);
      }
    });

    // Desconexión
    this.client.on('disconnected', (reason) => {
      logger.warn('❌ WhatsApp disconnected:', reason);
      this.isConnected = false;
      
      // NUEVO - Registrar desconexión
      metricsService.recordWhatsAppStatus(false);
      metricsService.recordError('whatsapp_disconnection', reason);
      
      // Intentar reconectar
      setTimeout(() => {
        this.initialize();
      }, 5000);
    });

    // Errores de autenticación
    this.client.on('auth_failure', (msg) => {
      logger.error('❌ Authentication failure:', msg);
      
      // NUEVO - Registrar fallo de autenticación
      metricsService.recordWhatsAppConnection(false);
      metricsService.recordError('whatsapp_auth', msg);
    });
  }

  // Manejar mensajes entrantes (compatible con tu webhook actual)
  async handleIncomingMessage(msg) {
    try {
      // NUEVO - Registrar mensaje recibido
      metricsService.recordMessageReceived(msg.from);
      
      // Guardar en base de datos
      const newMessage = new Message({
        from: msg.from,
        to: 'streaming-bot',
        message: msg.body,
        type: msg.type,
        status: 'received',
        fromMe: false,
        timestamp: msg.timestamp * 1000
      });
      
      await newMessage.save();

      // Llamar a tu webhook existente
      if (process.env.WPP_WEBHOOK_URL) {
        const axios = require('axios');
        await axios.post(process.env.WPP_WEBHOOK_URL, {
          type: 'chat',
          body: msg.body,
          from: msg.from,
          fromMe: false,
          timestamp: msg.timestamp * 1000,
          session: 'streaming-bot'
        });
      }

      logger.info(`📨 Message received from ${msg.from}`);
    } catch (error) {
      logger.error('Error handling incoming message:', error);
      // NUEVO - Registrar error
      metricsService.recordError('whatsapp_incoming', error.message);
    }
  }

  // Manejar mensajes salientes
  async handleOutgoingMessage(msg) {
    try {
      logger.info(`📤 Message sent to ${msg.to}`);
    } catch (error) {
      logger.error('Error handling outgoing message:', error);
    }
  }

  // === MÉTODOS COMPATIBLES CON TU CÓDIGO ACTUAL ===

  // Verificar conexión
  async checkConnection() {
    try {
      const state = await this.client?.getState();
      this.isConnected = state === 'CONNECTED';
      this.lastCheck = new Date();
      
      // NUEVO - Actualizar estado en métricas
      metricsService.recordWhatsAppStatus(this.isConnected);
      
      return {
        connected: this.isConnected,
        session: 'streaming-bot',
        lastCheck: this.lastCheck
      };
    } catch (error) {
      // NUEVO - Registrar error de verificación
      metricsService.recordError('whatsapp_check', error.message);
      
      return {
        connected: false,
        session: 'streaming-bot',
        error: error.message
      };
    }
  }

  // Formatear número (igual que tu código actual)
  formatPhoneNumber(phone) {
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    if (!cleaned.startsWith('51') && cleaned.length === 9) {
      cleaned = '51' + cleaned;
    }
    
    if (!cleaned.includes('@')) {
      cleaned = cleaned + '@c.us';
    }
    
    return cleaned;
  }

  // Enviar mensaje (compatible con tu messageController)
  async sendMessage(phone, message) {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      const result = await this.client.sendMessage(formattedPhone, message);
      
      logger.success(`Message sent to ${formattedPhone}`);
      
      // NUEVO - Registrar mensaje enviado exitosamente
      metricsService.recordMessageSent(formattedPhone, 'success');
      
      return {
        success: true,
        id: result.id._serialized,
        status: result.id
      };
    } catch (error) {
      logger.error(`Error sending message to ${phone}:`, error.message);
      
      // NUEVO - Registrar fallo de mensaje
      metricsService.recordMessageSent(phone, 'failed');
      metricsService.recordError('whatsapp_send', error.message, { phone });
      
      throw error;
    }
  }

  // Enviar archivo
  async sendFile(phone, base64Data, filename, caption = '') {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      
      // Convertir base64 a MessageMedia
      const media = new MessageMedia(
        'application/octet-stream', 
        base64Data.replace(/^data:.*base64,/, ''),
        filename
      );
      
      const result = await this.client.sendMessage(
        formattedPhone, 
        media, 
        { caption }
      );
      
      logger.success(`File sent to ${formattedPhone}: ${filename}`);
      return { success: true, id: result.id._serialized };
    } catch (error) {
      logger.error(`Error sending file to ${phone}:`, error.message);
      throw error;
    }
  }

  // Obtener QR Code
  async getQRCode() {
    if (this.isConnected) {
      return { connected: true, message: 'Already connected' };
    }
    
    if (this.qrCodeData) {
      return { qr: this.qrCodeData };
    }
    
    return { message: 'Waiting for QR code...' };
  }

  // Cerrar sesión
  async closeSession() {
    try {
      await this.client?.logout();
      this.isConnected = false;
      logger.info('WhatsApp session closed');
      return { success: true };
    } catch (error) {
      logger.error('Error closing session:', error.message);
      throw error;
    }
  }

  // Reiniciar sesión
  async restartSession() {
    try {
      await this.closeSession();
      await new Promise(resolve => setTimeout(resolve, 2000));
      this.initialize();
      return { success: true, message: 'Session restarting...' };
    } catch (error) {
      logger.error('Error restarting session:', error.message);
      throw error;
    }
  }

  // Obtener info de sesión
  async getSessionInfo() {
    try {
      const state = await this.client?.getState();
      const info = await this.client?.info;
      
      return {
        state: state,
        info: info,
        connected: this.isConnected,
        lastCheck: this.lastCheck
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  // Health check
  async healthCheck() {
    const connection = await this.checkConnection();
    
    return {
      status: connection.connected ? 'healthy' : 'unhealthy',
      connected: connection.connected,
      session: 'streaming-bot',
      lastCheck: this.lastCheck,
      timestamp: new Date().toISOString()
    };
  }

  // Métodos auxiliares (compatibles con tu código)
  extractCleanNumber(phone) {
    return phone.replace('@c.us', '').replace(/[\s\-\(\)]/g, '');
  }

  isPeruvianNumber(phone) {
    const cleanPhone = this.extractCleanNumber(phone);
    return cleanPhone.startsWith('51') && cleanPhone.length === 11;
  }

  generateWhatsAppLink(phone, message = '') {
    const cleanPhone = this.extractCleanNumber(phone);
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  }

  // NUEVO - Agregar método para verificación periódica de estado
  startHealthCheck() {
    // Verificar estado cada minuto
    setInterval(async () => {
      await this.checkConnection();
    }, 60 * 1000);
  }
}

// Singleton
module.exports = new WhatsAppWebService();