// controllers/userController.js
const User = require('../models/User');
const logger = require('../utils/logger');

class UserController {
  // Obtener todos los usuarios
  async getAll(req, res) {
    try {
      const { 
        page = 1, 
        limit = 50, 
        role, 
        status,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Verificar permisos
      if (!req.user.permissions?.users?.includes('view')) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to view users'
        });
      }

      const filters = {};
      
      if (role) {
        filters.role = role;
      }
      
      if (status) {
        filters.status = status;
      }

      const users = await User.find(filters, page, limit);
      const total = await User.count(filters);

      // Si hay búsqueda, filtrar por nombre o email
      let filteredUsers = users;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredUsers = users.filter(user => 
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
        );
      }

      // Estadísticas
      const stats = {
        total: total,
        active: await User.count({ status: 'active' }),
        suspended: await User.count({ status: 'suspended' }),
        byRole: {
          admin: await User.count({ role: 'admin' }),
          user: await User.count({ role: 'user' }),
          viewer: await User.count({ role: 'viewer' })
        }
      };

      res.json({
        success: true,
        data: {
          users: filteredUsers.map(user => user.toSafeObject()),
          stats: stats,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: filteredUsers.length,
            pages: Math.ceil(filteredUsers.length / limit)
          }
        }
      });

    } catch (error) {
      logger.error('Error getting users:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get users',
        details: error.message
      });
    }
  }

  // Obtener usuario por ID
  async getById(req, res) {
    try {
      const { id } = req.params;

      // Verificar permisos
      if (!req.user.permissions?.users?.includes('view')) {
        // Los usuarios solo pueden ver su propio perfil
        if (id !== req.user.id) {
          return res.status(403).json({
            success: false,
            error: 'You do not have permission to view this user'
          });
        }
      }

      const user = await User.findById(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user.toSafeObject()
      });

    } catch (error) {
      logger.error('Error getting user by ID:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get user',
        details: error.message
      });
    }
  }

  // Actualizar usuario
  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, email, role, status, permissions } = req.body;

      // Verificar permisos
      if (!req.user.permissions?.users?.includes('edit')) {
        // Los usuarios solo pueden editar su propio perfil (nombre y email)
        if (id !== req.user.id || role || status || permissions) {
          return res.status(403).json({
            success: false,
            error: 'You do not have permission to edit this user'
          });
        }
      }

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const updates = {};

      // Validar y aplicar cambios
      if (name) updates.name = name;

      if (email && email !== user.email) {
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

      // Solo admins pueden cambiar roles y estado
      if (req.user.role === 'admin') {
        if (role && ['admin', 'user', 'viewer'].includes(role)) {
          // No permitir que el último admin se quite el rol de admin
          if (user.role === 'admin' && role !== 'admin') {
            const adminCount = await User.count({ role: 'admin' });
            if (adminCount <= 1) {
              return res.status(400).json({
                success: false,
                error: 'Cannot remove admin role from the last administrator'
              });
            }
          }
          updates.role = role;
          
          // Actualizar permisos según el nuevo rol
          const tempUser = new User({ role });
          updates.permissions = tempUser.getDefaultPermissions();
        }

        if (status && ['active', 'suspended'].includes(status)) {
          // No permitir suspender el último admin
          if (user.role === 'admin' && status === 'suspended') {
            const activeAdminCount = await User.count({ 
              role: 'admin', 
              status: 'active' 
            });
            if (activeAdminCount <= 1) {
              return res.status(400).json({
                success: false,
                error: 'Cannot suspend the last active administrator'
              });
            }
          }
          updates.status = status;
        }

        // Permisos personalizados (sobrescriben los del rol)
        if (permissions && typeof permissions === 'object') {
          updates.permissions = permissions;
        }
      }

      const updatedUser = await User.update(id, updates);

      logger.info(`User updated: ${updatedUser.email} by ${req.user.email}`);

      res.json({
        success: true,
        data: updatedUser.toSafeObject()
      });

    } catch (error) {
      logger.error('Error updating user:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to update user',
        details: error.message
      });
    }
  }

  // Eliminar usuario
  async delete(req, res) {
    try {
      const { id } = req.params;

      // Verificar permisos
      if (!req.user.permissions?.users?.includes('delete')) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to delete users'
        });
      }

      // No permitir auto-eliminación
      if (id === req.user.id) {
        return res.status(400).json({
          success: false,
          error: 'You cannot delete your own account'
        });
      }

      const deleted = await User.delete(id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      logger.info(`User deleted: ID ${id} by ${req.user.email}`);

      res.json({
        success: true,
        data: {
          deletedId: id
        }
      });

    } catch (error) {
      logger.error('Error deleting user:', error.message);
      
      if (error.message.includes('last admin')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to delete user',
        details: error.message
      });
    }
  }

  // Suspender/Reactivar usuario
  async toggleStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      // Verificar permisos
      if (!req.user.permissions?.users?.includes('edit')) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to modify user status'
        });
      }

      if (!status || !['active', 'suspended'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Valid status (active/suspended) is required'
        });
      }

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // No permitir suspender el último admin activo
      if (user.role === 'admin' && status === 'suspended') {
        const activeAdminCount = await User.count({ 
          role: 'admin', 
          status: 'active' 
        });
        if (activeAdminCount <= 1) {
          return res.status(400).json({
            success: false,
            error: 'Cannot suspend the last active administrator'
          });
        }
      }

      const updates = {
        status: status,
        updatedAt: new Date().toISOString()
      };

      if (status === 'suspended' && reason) {
        updates.suspensionReason = reason;
      }

      const updatedUser = await User.update(id, updates);

      logger.info(`User ${status}: ${updatedUser.email} by ${req.user.email}`);

      res.json({
        success: true,
        data: updatedUser.toSafeObject(),
        message: `User ${status === 'active' ? 'activated' : 'suspended'} successfully`
      });

    } catch (error) {
      logger.error('Error toggling user status:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to update user status',
        details: error.message
      });
    }
  }

  // Obtener actividad del usuario
  async getActivity(req, res) {
    try {
      const { id } = req.params;
      const { days = 30 } = req.query;

      // Verificar permisos
      if (!req.user.permissions?.users?.includes('view')) {
        if (id !== req.user.id) {
          return res.status(403).json({
            success: false,
            error: 'You do not have permission to view user activity'
          });
        }
      }

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Obtener mensajes del sistema para este usuario
      const Message = require('../models/Message');
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - parseInt(days));

      const activities = await Message.find({
        to: id,
        type: 'activity',
        timestamp: { $gte: fromDate }
      });

      res.json({
        success: true,
        data: {
          user: user.toSafeObject(),
          activities: activities,
          period: `${days} days`
        }
      });

    } catch (error) {
      logger.error('Error getting user activity:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get user activity',
        details: error.message
      });
    }
  }

  // Obtener permisos disponibles
  async getAvailablePermissions(req, res) {
    try {
      // Verificar que sea admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Only administrators can view permission structure'
        });
      }

      const permissions = {
        clients: {
          view: 'View clients',
          create: 'Create new clients',
          edit: 'Edit client information',
          delete: 'Delete clients'
        },
        messages: {
          view: 'View messages',
          send: 'Send individual messages',
          bulk: 'Send bulk messages',
          delete: 'Delete messages'
        },
        users: {
          view: 'View all users',
          'view-own': 'View own profile',
          create: 'Create new users',
          edit: 'Edit user information',
          'edit-own': 'Edit own profile',
          delete: 'Delete users'
        },
        stats: {
          view: 'View statistics',
          export: 'Export statistics data'
        },
        settings: {
          view: 'View system settings',
          edit: 'Modify system settings'
        },
        workflows: {
          view: 'View workflows',
          create: 'Create workflows',
          edit: 'Edit workflows',
          delete: 'Delete workflows'
        }
      };

      res.json({
        success: true,
        data: permissions
      });

    } catch (error) {
      logger.error('Error getting permissions:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get permissions',
        details: error.message
      });
    }
  }
}

module.exports = new UserController();