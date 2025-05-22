const { wppClient, WPP_SESSION } = require('../config/wppconnect');
const logger = require('../utils/logger');

class SessionController {
  // Verificar estado de la sesión
  async getStatus(req, res) {
    try {
      const response = await wppClient.get(`/api/${WPP_SESSION}/check-connection-session`);
      
      res.json({
        success: true,
        data: {
          session: WPP_SESSION,
          status: response.data.status ? 'connected' : 'disconnected',
          message: response.data.message,
          lastCheck: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error checking session status:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to check session status',
        details: error.response?.data || error.message
      });
    }
  }

  // Iniciar nueva sesión
  async startSession(req, res) {
    try {
      const { autoClose = 120, webhook = "" } = req.body;
      
      const response = await wppClient.post(`/api/${WPP_SESSION}/start-session`, {
        webhook: webhook,
        waitQrCode: true,
        autoClose: autoClose
      });

      logger.info(`Session ${WPP_SESSION} start initiated`);
      
      res.json({
        success: true,
        data: response.data,
        message: 'Session start initiated'
      });
    } catch (error) {
      logger.error('Error starting session:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to start session',
        details: error.response?.data || error.message
      });
    }
  }

  // Obtener código QR
  async getQRCode(req, res) {
    try {
      const response = await wppClient.get(`/api/${WPP_SESSION}/qrcode-session`);
      
      // Si es una imagen, devolver la imagen directamente
      if (response.headers['content-type']?.includes('image')) {
        res.set('Content-Type', response.headers['content-type']);
        res.send(response.data);
      } else {
        res.json({
          success: true,
          qrCode: response.data,
          session: WPP_SESSION
        });
      }
    } catch (error) {
      logger.error('Error getting QR code:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get QR code',
        details: error.response?.data || error.message
      });
    }
  }

  // Cerrar sesión
  async closeSession(req, res) {
    try {
      const response = await wppClient.post(`/api/${WPP_SESSION}/close-session`);
      
      logger.info(`Session ${WPP_SESSION} closed`);
      
      res.json({
        success: true,
        data: response.data,
        message: 'Session closed successfully'
      });
    } catch (error) {
      logger.error('Error closing session:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to close session',
        details: error.response?.data || error.message
      });
    }
  }

  // Obtener información de la sesión
  async getSessionInfo(req, res) {
    try {
      const response = await wppClient.get(`/api/${WPP_SESSION}/status-session`);
      
      res.json({
        success: true,
        data: {
          session: WPP_SESSION,
          ...response.data
        }
      });
    } catch (error) {
      logger.error('Error getting session info:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get session info',
        details: error.response?.data || error.message
      });
    }
  }

  // Reiniciar sesión
  async restartSession(req, res) {
    try {
      // Primero cerrar la sesión existente
      await wppClient.post(`/api/${WPP_SESSION}/close-session`).catch(() => {});
      
      // Esperar un momento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Iniciar nueva sesión
      const response = await wppClient.post(`/api/${WPP_SESSION}/start-session`, {
        webhook: "",
        waitQrCode: true,
        autoClose: 120
      });

      logger.info(`Session ${WPP_SESSION} restarted`);
      
      res.json({
        success: true,
        data: response.data,
        message: 'Session restarted successfully'
      });
    } catch (error) {
      logger.error('Error restarting session:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to restart session',
        details: error.response?.data || error.message
      });
    }
  }
}

module.exports = new SessionController();