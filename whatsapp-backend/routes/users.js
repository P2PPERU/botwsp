// routes/users.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, checkRole } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// GET /api/users - Obtener todos los usuarios
router.get('/', userController.getAll);

// GET /api/users/permissions - Obtener estructura de permisos (solo admin)
router.get('/permissions', checkRole(['admin']), userController.getAvailablePermissions);

// GET /api/users/:id - Obtener usuario por ID
router.get('/:id', userController.getById);

// GET /api/users/:id/activity - Obtener actividad del usuario
router.get('/:id/activity', userController.getActivity);

// PUT /api/users/:id - Actualizar usuario
router.put('/:id', userController.update);

// DELETE /api/users/:id - Eliminar usuario (solo admin)
router.delete('/:id', checkRole(['admin']), userController.delete);

// POST /api/users/:id/toggle-status - Suspender/Reactivar usuario (solo admin)
router.post('/:id/toggle-status', checkRole(['admin']), userController.toggleStatus);

module.exports = router;