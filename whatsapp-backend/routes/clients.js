const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const validation = require('../middleware/validation');

// GET /api/clients - Obtener todos los clientes
router.get('/', clientController.getAll);

// GET /api/clients/expiring - Obtener clientes próximos a vencer
router.get('/expiring', clientController.getExpiring);

// GET /api/clients/:id - Obtener cliente por ID
router.get('/:id', 
  validation.validateId,
  clientController.getById
);

// POST /api/clients - Crear nuevo cliente
router.post('/', 
  validation.validateClient,
  clientController.create
);

// PUT /api/clients/:id - Actualizar cliente
router.put('/:id', 
  validation.validateId,
  validation.validateClientUpdate,
  clientController.update
);

// DELETE /api/clients/:id - Eliminar cliente
router.delete('/:id', 
  validation.validateId,
  clientController.delete
);

// POST /api/clients/:id/renew - Renovar suscripción
router.post('/:id/renew', 
  validation.validateId,
  validation.validateRenewal,
  clientController.renewSubscription
);

// POST /api/clients/:id/suspend - Suspender cliente
router.post('/:id/suspend', 
  validation.validateId,
  validation.validateSuspension,
  clientController.suspend
);

// POST /api/clients/:id/reactivate - Reactivar cliente
router.post('/:id/reactivate', 
  validation.validateId,
  clientController.reactivate
);

// POST /api/clients/import - Importar clientes masivamente
router.post('/import', 
  validation.validateImport,
  clientController.importClients
);

module.exports = router;