// controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const Message = require('../models/Message');

class AuthController {
  // Login
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validar entrada
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
      }

      // Buscar usuario
      const user = await User.findByEmail(email);
      if (!user) {
        logger.warn(`Login attempt with unknown email: ${email}`);
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }

      // Verificar si está bloqueado
      if (user.isLocked()) {
        const lockTime = new Date(user.lockedUntil).toLocaleString();
        logger.warn(`Login attempt on locked account: ${email}`);
        return res.status(423).json({
          success: false,
          error: `Account locked until ${lockTime} due to multiple failed attempts`
        });
      }

      // Verificar si está suspendido
      if (user.status === 'suspended') {
        logger.warn(`Login attempt on suspended account: ${email}`);
        return res.status(403).json({
          success: false,
          error: 'Account suspended. Please contact administrator.'
        });
      }

      // Verificar contraseña
      const isValidPassword = await user.verifyPassword(password);
      if (!isValidPassword) {
        await user.incrementLoginAttempts();
        logger.warn(`Failed login attempt for: ${email}`);
        
        const remainingAttempts = 5 - user.loginAttempts;
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
          remainingAttempts: remainingAttempts > 0 ? remainingAttempts : 0
        });
      }

      // Login exitoso - actualizar información
      await user.updateLoginInfo();

      // Generar token JWT
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: user.permissions
        },
        process.env.JWT_SECRET || 'your-secret-key',
        {
          expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        }
      );

      // Generar refresh token
      const refreshToken = jwt.sign(
        { id: user.id, type: 'refresh' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      logger.success(`User logged in: ${user.email} (${user.role})`);

      // Guardar actividad
      const loginActivity = new Message({
        from: 'system',
        to: user.id,
        message: `Login successful from IP: ${req.ip}`,
        type: 'activity',
        status: 'delivered'
      });
      await loginActivity.save();

      res.json({
        success: true,
        data: {
          token,
          refreshToken,
          user: user.toSafeObject()
        }
      });

    } catch (error) {
      logger.error('Login error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Login failed. Please try again.'
      });
    }
  }

  // Registro (solo admins pueden crear usuarios)
  async register(req, res) {
    try {
      const { email, password, name, role = 'viewer' } = req.body;

      // Verificar permisos
      if (!req.user.permissions?.users?.includes('create')) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to create users'
        });
      }

      // Validar entrada
      if (!email || !password || !name) {
        return res.status(400).json({
          success: false,
          error: 'Email, password and name are required'
        });
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format'
        });
      }

      // Validar contraseña fuerte
      const passwordValidation = User.validatePassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Password does not meet requirements',
          details: passwordValidation.errors
        });
      }

      // Verificar si el usuario existe
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'A user with this email already exists'
        });
      }

      // Solo admins pueden crear otros admins
      if (role === 'admin' && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Only administrators can create admin accounts'
        });
      }

      // Hash de la contraseña
      const hashedPassword = await User.hashPassword(password);

      // Crear usuario
      const newUser = new User({
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        role,
        createdBy: req.user.id
      });

      await newUser.save();

      logger.success(`New user created: ${email} (${role}) by ${req.user.email}`);

      res.status(201).json({
        success: true,
        data: {
          user: newUser.toSafeObject()
        }
      });

    } catch (error) {
      logger.error('Register error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Registration failed. Please try again.'
      });
    }
  }

  // Verificar token actual
  async verify(req, res) {
    res.json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role,
          permissions: req.user.permissions
        },
        valid: true,
        expiresAt: new Date(req.user.exp * 1000).toISOString()
      }
    });
  }

  // Refresh token
  async refresh(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token is required'
        });
      }

      // Verificar refresh token
      const decoded = jwt.verify(
        refreshToken, 
        process.env.JWT_SECRET || 'your-secret-key'
      );

      if (decoded.type !== 'refresh') {
        return res.status(401).json({
          success: false,
          error: 'Invalid refresh token'
        });
      }

      // Buscar usuario
      const user = await User.findById(decoded.id);
      if (!user || user.status !== 'active') {
        return res.status(401).json({
          success: false,
          error: 'User not found or inactive'
        });
      }

      // Generar nuevo token
      const newToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: user.permissions
        },
        process.env.JWT_SECRET || 'your-secret-key',
        {
          expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        }
      );

      res.json({
        success: true,
        data: {
          token: newToken,
          user: user.toSafeObject()
        }
      });

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Refresh token expired. Please login again.'
        });
      }
      
      logger.error('Refresh token error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to refresh token'
      });
    }
  }

  // Cambiar contraseña
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Current and new password are required'
        });
      }

      // Validar nueva contraseña
      const passwordValidation = User.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'New password does not meet requirements',
          details: passwordValidation.errors
        });
      }

      // Buscar usuario actual
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Verificar contraseña actual
      const isValidPassword = await user.verifyPassword(currentPassword);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }

      // Cambiar contraseña
      user.password = await User.hashPassword(newPassword);
      user.updatedAt = new Date().toISOString();
      await user.save();

      logger.success(`Password changed for user: ${user.email}`);

      res.json({
        success: true,
        message: 'Password changed successfully. Please login again with your new password.'
      });

    } catch (error) {
      logger.error('Change password error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to change password'
      });
    }
  }

  // Restablecer contraseña (para admins)
  async resetPassword(req, res) {
    try {
      const { userId, newPassword } = req.body;

      // Verificar permisos
      if (!req.user.permissions?.users?.includes('edit')) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to reset passwords'
        });
      }

      if (!userId || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'User ID and new password are required'
        });
      }

      // Validar nueva contraseña
      const passwordValidation = User.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Password does not meet requirements',
          details: passwordValidation.errors
        });
      }

      // Buscar usuario
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Cambiar contraseña
      user.password = await User.hashPassword(newPassword);
      user.loginAttempts = 0;
      user.lockedUntil = null;
      user.updatedAt = new Date().toISOString();
      await user.save();

      logger.success(`Password reset for user: ${user.email} by ${req.user.email}`);

      res.json({
        success: true,
        message: 'Password reset successfully'
      });

    } catch (error) {
      logger.error('Reset password error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to reset password'
      });
    }
  }

  // Logout
  async logout(req, res) {
    logger.info(`User logged out: ${req.user.email}`);
    
    // En una implementación real, aquí podrías:
    // - Invalidar el token en una blacklist de Redis
    // - Registrar la actividad de logout
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }

  // Obtener perfil del usuario actual
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          user: user.toSafeObject()
        }
      });

    } catch (error) {
      logger.error('Get profile error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get profile'
      });
    }
  }

  // Actualizar perfil
  async updateProfile(req, res) {
    try {
      const { name, email } = req.body;
      const updates = {};

      if (name) updates.name = name;
      
      if (email && email !== req.user.email) {
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid email format'
          });
        }

        // Verificar que no esté en uso
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
          return res.status(409).json({
            success: false,
            error: 'Email already in use'
          });
        }

        updates.email = email.toLowerCase();
      }

      const user = await User.update(req.user.id, updates);

      logger.info(`Profile updated for user: ${user.email}`);

      res.json({
        success: true,
        data: {
          user: user.toSafeObject()
        }
      });

    } catch (error) {
      logger.error('Update profile error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }
  }
}

module.exports = new AuthController();