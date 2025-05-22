const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');

// GET /api/sessions/status - Verificar estado de la sesión
router.get('/status', sessionController.getStatus);

// POST /api/sessions/start - Iniciar nueva sesión
router.post('/start', sessionController.startSession);

// GET /api/sessions/qr - Obtener código QR
router.get('/qr', sessionController.getQRCode);

// POST /api/sessions/close - Cerrar sesión
router.post('/close', sessionController.closeSession);

// GET /api/sessions/info - Información detallada de la sesión
router.get('/info', sessionController.getSessionInfo);

// POST /api/sessions/restart - Reiniciar sesión
router.post('/restart', sessionController.restartSession);

module.exports = router;