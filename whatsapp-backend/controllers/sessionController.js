const whatsappService = require('../services/whatsappWebService');
const logger = require('../utils/logger');

class SessionController {
  // Verificar estado de la sesión
  async getStatus(req, res) {
    try {
      const status = await whatsappService.checkConnection();
      
      res.json({
        success: true,
        status: status.connected,
        message: status.connected ? 'Conectado' : 'Desconectado',
        session: status.session || 'streaming-bot',
        lastCheck: status.lastCheck || new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error checking session status:', error.message);
      res.status(500).json({
        success: false,
        status: false,
        error: 'Failed to check session status',
        details: error.message
      });
    }
  }

  // Obtener código QR
  async getQRCode(req, res) {
    try {
      const qrData = await whatsappService.getQRCode();
      
      if (qrData.connected) {
        res.json({
          success: true,
          connected: true,
          message: 'Already connected'
        });
      } else if (qrData.qr) {
        res.json({
          success: true,
          qrCode: qrData.qr,
          session: 'streaming-bot',
          message: 'Scan QR code with WhatsApp'
        });
      } else {
        res.json({
          success: true,
          message: 'Initializing... Please wait and try again in a few seconds'
        });
      }
    } catch (error) {
      logger.error('Error getting QR code:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get QR code',
        details: error.message
      });
    }
  }

  // Cerrar sesión
  async closeSession(req, res) {
    try {
      await whatsappService.closeSession();
      
      logger.info('Session closed');
      
      res.json({
        success: true,
        message: 'Session closed successfully'
      });
    } catch (error) {
      logger.error('Error closing session:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to close session',
        details: error.message
      });
    }
  }

  // Obtener información de la sesión
  async getSessionInfo(req, res) {
    try {
      const info = await whatsappService.getSessionInfo();
      
      res.json({
        success: true,
        data: {
          session: 'streaming-bot',
          ...info
        }
      });
    } catch (error) {
      logger.error('Error getting session info:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get session info',
        details: error.message
      });
    }
  }

  // Reiniciar sesión
  async restartSession(req, res) {
    try {
      await whatsappService.restartSession();
      
      logger.info('Session restarting...');
      
      res.json({
        success: true,
        message: 'Session restarting... Check QR code in a few seconds'
      });
    } catch (error) {
      logger.error('Error restarting session:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to restart session',
        details: error.message
      });
    }
  }

  // Iniciar sesión (compatibilidad con frontend antiguo)
  async startSession(req, res) {
    res.json({
      success: true,
      message: 'Session auto-starts with whatsapp-web.js. Check /api/sessions/qr for QR code',
      data: {
        status: 'initialized'
      }
    });
  }
}

module.exports = new SessionController();