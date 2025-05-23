// models/User.js
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Base de datos en archivo JSON (temporal)
const DB_PATH = path.join(__dirname, '../data/users.json');

class User {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.email = data.email;
    this.password = data.password; // Ya debe venir hasheada
    this.name = data.name;
    this.role = data.role || 'viewer'; // admin, user, viewer
    this.status = data.status || 'active'; // active, suspended
    this.lastLogin = data.lastLogin || null;
    this.loginAttempts = data.loginAttempts || 0;
    this.lockedUntil = data.lockedUntil || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.createdBy = data.createdBy || null;
    this.permissions = data.permissions || this.getDefaultPermissions();
  }

  // Generar ID único
  generateId() {
    return `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }

  // Permisos por defecto según rol
  getDefaultPermissions() {
    const rolePermissions = {
      admin: {
        clients: ['view', 'create', 'edit', 'delete'],
        messages: ['view', 'send', 'bulk', 'delete'],
        users: ['view', 'create', 'edit', 'delete'],
        stats: ['view', 'export'],
        settings: ['view', 'edit'],
        workflows: ['view', 'create', 'edit', 'delete']
      },
      user: {
        clients: ['view', 'create', 'edit'],
        messages: ['view', 'send'],
        users: ['view-own', 'edit-own'],
        stats: ['view'],
        settings: ['view'],
        workflows: ['view']
      },
      viewer: {
        clients: ['view'],
        messages: ['view'],
        users: ['view-own'],
        stats: ['view'],
        settings: [],
        workflows: []
      }
    };

    return rolePermissions[this.role] || rolePermissions.viewer;
  }

  // Verificar si tiene un permiso específico
  hasPermission(resource, action) {
    return this.permissions[resource]?.includes(action) || false;
  }

  // Guardar usuario
  async save() {
    const users = await this.loadUsers();
    
    // Si existe, actualizar
    const existingIndex = users.findIndex(u => u.id === this.id);
    if (existingIndex !== -1) {
      this.updatedAt = new Date().toISOString();
      users[existingIndex] = this.toJSON();
    } else {
      // Si es nuevo, agregar
      users.push(this.toJSON());
    }

    await this.saveUsers(users);
    return this;
  }

  // Convertir a JSON (sin password)
  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return {
      ...userWithoutPassword,
      password: this.password // Guardamos el hash en la BD
    };
  }

  // Convertir a objeto seguro (sin password)
  toSafeObject() {
    const { password, loginAttempts, lockedUntil, ...safeUser } = this;
    return safeUser;
  }

  // Cargar usuarios desde archivo
  async loadUsers() {
    try {
      if (!fs.existsSync(DB_PATH)) {
        // Crear archivo con usuario admin por defecto si no existe
        const defaultUsers = [
          {
            id: 'user_admin_1',
            email: 'admin@whatsapphub.com',
            password: await bcrypt.hash('Admin123!', 10), // Cambiar en producción
            name: 'Administrador',
            role: 'admin',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            permissions: this.getDefaultPermissions.call({ role: 'admin' })
          }
        ];
        
        // Crear directorio si no existe
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(DB_PATH, JSON.stringify(defaultUsers, null, 2));
        return defaultUsers;
      }

      const data = fs.readFileSync(DB_PATH, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  }

  // Guardar usuarios en archivo
  async saveUsers(users) {
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
    } catch (error) {
      console.error('Error saving users:', error);
      throw error;
    }
  }

  // Métodos estáticos
  static async findAll() {
    const instance = new User({});
    const users = await instance.loadUsers();
    return users.map(userData => new User(userData));
  }

  static async findById(id) {
    const instance = new User({});
    const users = await instance.loadUsers();
    const userData = users.find(u => u.id === id);
    return userData ? new User(userData) : null;
  }

  static async findByEmail(email) {
    const instance = new User({});
    const users = await instance.loadUsers();
    const userData = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    return userData ? new User(userData) : null;
  }

  static async find(filters = {}, page = 1, limit = 50) {
    const instance = new User({});
    let users = await instance.loadUsers();

    // Aplicar filtros
    if (Object.keys(filters).length > 0) {
      users = users.filter(user => {
        for (const [key, value] of Object.entries(filters)) {
          if (user[key] !== value) {
            return false;
          }
        }
        return true;
      });
    }

    // Ordenar por fecha de creación (más recientes primero)
    users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return users.slice(startIndex, endIndex).map(userData => new User(userData));
  }

  static async count(filters = {}) {
    const instance = new User({});
    let users = await instance.loadUsers();

    if (Object.keys(filters).length === 0) {
      return users.length;
    }

    const filtered = users.filter(user => {
      for (const [key, value] of Object.entries(filters)) {
        if (user[key] !== value) {
          return false;
        }
      }
      return true;
    });

    return filtered.length;
  }

  static async update(id, updateData) {
    const user = await User.findById(id);
    if (!user) {
      return null;
    }

    // Actualizar datos
    Object.assign(user, updateData);
    user.updatedAt = new Date().toISOString();

    await user.save();
    return user;
  }

  static async delete(id) {
    const instance = new User({});
    const users = await instance.loadUsers();
    
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return false;
    }

    // No permitir eliminar el último admin
    const user = users[userIndex];
    if (user.role === 'admin') {
      const adminCount = users.filter(u => u.role === 'admin').length;
      if (adminCount <= 1) {
        throw new Error('Cannot delete the last admin user');
      }
    }

    users.splice(userIndex, 1);
    await instance.saveUsers(users);
    return true;
  }

  // Métodos de autenticación
  async verifyPassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  async updateLoginInfo() {
    this.lastLogin = new Date().toISOString();
    this.loginAttempts = 0;
    this.lockedUntil = null;
    await this.save();
  }

  async incrementLoginAttempts() {
    this.loginAttempts += 1;
    
    // Bloquear después de 5 intentos
    if (this.loginAttempts >= 5) {
      const lockTime = 30 * 60 * 1000; // 30 minutos
      this.lockedUntil = new Date(Date.now() + lockTime).toISOString();
    }
    
    await this.save();
  }

  isLocked() {
    if (!this.lockedUntil) return false;
    return new Date(this.lockedUntil) > new Date();
  }

  // Hash password estático
  static async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  // Validar contraseña fuerte
  static validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);

    const errors = [];

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    }
    if (!hasSpecialChar) {
      errors.push('Password must contain at least one special character (!@#$%^&*)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = User;