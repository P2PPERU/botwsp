const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflowController');

// GET /api/workflows - Obtener workflows activos
router.get('/', workflowController.getActiveWorkflows);

// GET /api/workflows/health - Health check de n8n
router.get('/health', workflowController.healthCheck);

// GET /api/workflows/stats - Estadísticas de ejecuciones
router.get('/stats', workflowController.getExecutionStats);

// GET /api/workflows/:workflowId - Obtener detalles de workflow específico
router.get('/:workflowId', workflowController.getWorkflowDetails);

// POST /api/workflows/:workflowId/execute - Ejecutar workflow manualmente
router.post('/:workflowId/execute', workflowController.executeWorkflow);

// PATCH /api/workflows/:workflowId/toggle - Activar/desactivar workflow
router.patch('/:workflowId/toggle', workflowController.toggleWorkflow);

// POST /api/workflows/trigger/reminder - Disparar workflow de recordatorios
router.post('/trigger/reminder', workflowController.triggerReminderWorkflow);

// POST /api/workflows/trigger/auto-response - Disparar workflow de respuesta automática
router.post('/trigger/auto-response', workflowController.triggerAutoResponseWorkflow);

// POST /api/workflows/create - Crear workflow personalizado
router.post('/create', workflowController.createCustomWorkflow);

module.exports = router;