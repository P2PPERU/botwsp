const { wppClient, WPP_SESSION } = require('../config/wppconnect');
const logger = require('../utils/logger');

class WppService {
  constructor() {
    this.session = WPP_SESSION;
    this.isConnected = false;
    this.lastCheck = null;
  }

  // Verificar estado de conexión
  async checkConnection() {
    try {
      const response = await wppClient.get(`/api/${this.session}/check-connection-session`);
      this.isConnected = response.data.status;
      this.lastCheck = new Date();
      
      return {
        connected: this.isConnected,
        session: this.session,
        lastCheck: this.lastCheck
      };
    } catch (error) {
      logger.error('Error checking WPP connection:', error.message);
      this.isConnected = false;
      return {
        connected: false,
        session: this.session,
        error: error.message
      };
    }
  }

  // Formatear número de teléfono
  formatPhoneNumber(phone) {
    // Remover espacios, guiones y paréntesis
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // Si no empieza con código de país, agregar 51 (Perú por defecto)
    if (!cleaned.startsWith('51') && cleaned.length === 9) {
      cleaned = '51' + cleaned;
    }
    
    // Asegurar que termine con @c.us para WhatsApp
    if (!cleaned.includes('@')) {
      cleaned = cleaned + '@c.us';
    }
    
    return cleaned;
  }

  // Enviar mensaje de texto
  async sendMessage(phone, message) {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      
      const response = await wppClient.post(`/api/${this.session}/send-message`, {
        phone: formattedPhone,
        message: message
      });

      logger.success(`Message sent to ${formattedPhone}`);
      return response.data;
    } catch (error) {
      logger.error(`Error sending message to ${phone}:`, error.message);
      throw error;
    }
  }

  // Enviar archivo
  async sendFile(phone, base64Data, filename, caption = '') {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      
      const response = await wppClient.post(`/api/${this.session}/send-file`, {
        phone: formattedPhone,
        base64: base64Data,
        filename: filename,
        caption: caption
      });

      logger.success(`File sent to ${formattedPhone}: ${filename}`);
      return response.data;
    } catch (error) {
      logger.error(`Error sending file to ${phone}:`, error.message);
      throw error;
    }
  }

  // Enviar imagen
  async sendImage(phone, base64Image, caption = '') {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      
      const response = await wppClient.post(`/api/${this.session}/send-image`, {
        phone: formattedPhone,
        base64: base64Image,
        caption: caption
      });

      logger.success(`Image sent to ${formattedPhone}`);
      return response.data;
    } catch (error) {
      logger.error(`Error sending image to ${phone}:`, error.message);
      throw error;
    }
  }

  // Obtener información de contacto
  async getContactInfo(phone) {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      
      const response = await wppClient.get(`/api/${this.session}/contact/${formattedPhone}`);
      return response.data;
    } catch (error) {
      logger.error(`Error getting contact info for ${phone}:`, error.message);
      throw error;
    }
  }

  // Verificar si un número está en WhatsApp
  async checkNumberExists(phone) {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      
      const response = await wppClient.get(`/api/${this.session}/check-number-status/${formattedPhone}`);
      return response.data.exists;
    } catch (error) {
      logger.error(`Error checking number ${phone}:`, error.message);
      return false;
    }
  }

  // Obtener QR Code para iniciar sesión
  async getQRCode() {
    try {
      const response = await wppClient.get(`/api/${this.session}/qrcode-session`);
      return response.data;
    } catch (error) {
      logger.error('Error getting QR code:', error.message);
      throw error;
    }
  }

  // Cerrar sesión
  async closeSession() {
    try {
      const response = await wppClient.post(`/api/${this.session}/close-session`);
      this.isConnected = false;
      logger.info('WPP Session closed');
      return response.data;
    } catch (error) {
      logger.error('Error closing session:', error.message);
      throw error;
    }
  }

  // Reiniciar sesión
  async restartSession() {
    try {
      // Cerrar sesión actual
      await this.closeSession().catch(() => {});
      
      // Esperar un momento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Iniciar nueva sesión
      const response = await wppClient.post(`/api/${this.session}/start-session`, {
        webhook: process.env.WEBHOOK_URL || "",
        waitQrCode: true,
        autoClose: 120
      });

      logger.info('WPP Session restarted');
      return response.data;
    } catch (error) {
      logger.error('Error restarting session:', error.message);
      throw error;
    }
  }

  // Obtener estadísticas de la sesión
  async getSessionStats() {
    try {
      const response = await wppClient.get(`/api/${this.session}/status-session`);
      return {
        ...response.data,
        isConnected: this.isConnected,
        lastCheck: this.lastCheck
      };
    } catch (error) {
      logger.error('Error getting session stats:', error.message);
      throw error;
    }
  }

  // Validar mensaje antes de enviar
  validateMessage(phone, message) {
    const errors = [];
    
    if (!phone || phone.trim().length === 0) {
      errors.push('Phone number is required');
    }
    
    if (!message || message.trim().length === 0) {
      errors.push('Message is required');
    }
    
    if (message && message.length > 4096) {
      errors.push('Message too long (max 4096 characters)');
    }
    
    const phoneRegex = /^[0-9]{8,15}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)@c.us]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      errors.push('Invalid phone number format');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Extraer número limpio (sin @c.us)
  extractCleanNumber(phone) {
    return phone.replace('@c.us', '').replace(/[\s\-\(\)]/g, '');
  }

  // Verificar si es un número peruano
  isPeruvianNumber(phone) {
    const cleanPhone = this.extractCleanNumber(phone);
    return cleanPhone.startsWith('51') && cleanPhone.length === 11;
  }

  // Generar enlace de WhatsApp Web
  generateWhatsAppLink(phone, message = '') {
    const cleanPhone = this.extractCleanNumber(phone);
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  }

  // Delay entre mensajes para evitar spam
  async delay(ms = 2000) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Verificar health del servicio
  async healthCheck() {
    try {
      const connection = await this.checkConnection();
      const stats = await this.getSessionStats();
      
      return {
        status: 'healthy',
        connected: connection.connected,
        session: this.session,
        uptime: stats.uptime || 'unknown',
        lastCheck: this.lastCheck,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        connected: false,
        session: this.session,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new WppService();