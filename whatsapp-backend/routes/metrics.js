const express = require('express');
const router = express.Router();
const metricsController = require('../controllers/metricsController');
const { checkRole } = require('../middleware/auth');

// GET /api/metrics/summary - Resumen de métricas (todos los usuarios autenticados)
router.get('/summary', metricsController.getSummary);

// GET /api/metrics/dashboard - Dashboard completo
router.get('/dashboard', metricsController.getDashboard);

// GET /api/metrics/detailed - Métricas detalladas (solo admin)
router.get('/detailed', checkRole(['admin']), metricsController.getDetailed);

// GET /api/metrics/hourly - Actividad por hora
router.get('/hourly', metricsController.getHourlyActivity);

// GET /api/metrics/costs - Métricas de costos
router.get('/costs', metricsController.getCosts);

// GET /api/metrics/errors - Métricas de errores
router.get('/errors', metricsController.getErrors);

// GET /api/metrics/system - Estado del sistema
router.get('/system', metricsController.getSystemStatus);

// GET /api/metrics/historical - Histórico de métricas
router.get('/historical', checkRole(['admin']), metricsController.getHistorical);

// GET /api/metrics/export - Exportar métricas
router.get('/export', checkRole(['admin']), metricsController.exportMetrics);

module.exports = router;