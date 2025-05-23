// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// ====================================
// RUTAS PÚBLICAS (sin autenticación)
// ====================================

// POST /api/auth/login - Iniciar sesión
router.post('/login', authController.login);

// POST /api/auth/refresh - Renovar token
router.post('/refresh', authController.refresh);

// ====================================
// RUTAS PROTEGIDAS (requieren token)
// ====================================

// GET /api/auth/verify - Verificar token actual
router.get('/verify', verifyToken, authController.verify);

// POST /api/auth/logout - Cerrar sesión
router.post('/logout', verifyToken, authController.logout);

// GET /api/auth/profile - Obtener perfil actual
router.get('/profile', verifyToken, authController.getProfile);

// PUT /api/auth/profile - Actualizar perfil propio
router.put('/profile', verifyToken, authController.updateProfile);

// POST /api/auth/change-password - Cambiar contraseña propia
router.post('/change-password', verifyToken, authController.changePassword);

// POST /api/auth/register - Crear nuevo usuario (solo admin)
router.post('/register', verifyToken, authController.register);

// POST /api/auth/reset-password - Restablecer contraseña de otro usuario (solo admin)
router.post('/reset-password', verifyToken, authController.resetPassword);

module.exports = router;