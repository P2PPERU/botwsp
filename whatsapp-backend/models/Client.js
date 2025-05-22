const fs = require('fs');
const path = require('path');

// Base de datos en archivo JSON (temporal)
const DB_PATH = path.join(__dirname, '../data/clients.json');

class Client {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.name = data.name;
    this.phone = data.phone;
    this.service = data.service;
    this.plan = data.plan || 'Estándar';
    this.expiry = data.expiry;
    this.status = data.status || 'active';
    this.lastPayment = data.lastPayment || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.suspensionReason = data.suspensionReason || null;
    this.suspendedAt = data.suspendedAt || null;
    this.reactivatedAt = data.reactivatedAt || null;
    this.notes = data.notes || '';
  }

  // Generar ID único
  generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  // Guardar cliente
  async save() {
    const clients = await this.loadClients();
    
    // Si existe, actualizar
    const existingIndex = clients.findIndex(c => c.id === this.id);
    if (existingIndex !== -1) {
      this.updatedAt = new Date().toISOString();
      clients[existingIndex] = this;
    } else {
      // Si es nuevo, agregar
      clients.push(this);
    }

    await this.saveClients(clients);
    return this;
  }

  // Cargar clientes desde archivo
  async loadClients() {
    try {
      if (!fs.existsSync(DB_PATH)) {
        // Crear archivo con datos de ejemplo si no existe
        const defaultClients = [
          {
            id: 1,
            name: "Juan Pérez",
            phone: "51987654321",
            service: "Netflix Premium",
            plan: "Familiar",
            expiry: "2025-05-25",
            status: "active",
            lastPayment: "2025-04-25",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 2,
            name: "María García",
            phone: "51923456789",
            service: "Disney+ Familiar",
            plan: "Premium",
            expiry: "2025-05-24",
            status: "expiring",
            lastPayment: "2025-04-24",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 3,
            name: "Carlos López",
            phone: "51956789123",
            service: "Prime Video",
            plan: "Basic",
            expiry: "2025-05-22",
            status: "expired",
            lastPayment: "2025-04-22",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        
        // Crear directorio si no existe
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(DB_PATH, JSON.stringify(defaultClients, null, 2));
        return defaultClients;
      }

      const data = fs.readFileSync(DB_PATH, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading clients:', error);
      return [];
    }
  }

  // Guardar clientes en archivo
  async saveClients(clients) {
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(DB_PATH, JSON.stringify(clients, null, 2));
    } catch (error) {
      console.error('Error saving clients:', error);
      throw error;
    }
  }

  // Métodos estáticos
  static async findAll() {
    const instance = new Client({});
    return await instance.loadClients();
  }

  static async find(filters = {}, page = 1, limit = 50, sortBy = 'name', sortOrder = 'asc') {
    const instance = new Client({});
    let clients = await instance.loadClients();

    // Aplicar filtros
    if (Object.keys(filters).length > 0) {
      clients = clients.filter(client => {
        for (const [key, value] of Object.entries(filters)) {
          if (key === '$or') {
            // Manejo especial para búsqueda OR
            return value.some(condition => {
              for (const [condKey, condValue] of Object.entries(condition)) {
                if (typeof condValue === 'object' && condValue.$regex) {
                  return new RegExp(condValue.$regex, condValue.$options || '').test(client[condKey] || '');
                }
                return client[condKey] === condValue;
              }
            });
          } else if (typeof value === 'object' && value.$regex) {
            if (!new RegExp(value.$regex, value.$options || '').test(client[key] || '')) {
              return false;
            }
          } else if (client[key] !== value) {
            return false;
          }
        }
        return true;
      });
    }

    // Ordenar
    clients.sort((a, b) => {
      const aVal = a[sortBy] || '';
      const bVal = b[sortBy] || '';
      
      if (sortOrder === 'desc') {
        return bVal.localeCompare(aVal);
      }
      return aVal.localeCompare(bVal);
    });

    // Paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return clients.slice(startIndex, endIndex);
  }

  static async count(filters = {}) {
    const instance = new Client({});
    let clients = await instance.loadClients();

    if (Object.keys(filters).length === 0) {
      return clients.length;
    }

    // Aplicar los mismos filtros que en find()
    const filtered = clients.filter(client => {
      for (const [key, value] of Object.entries(filters)) {
        if (key === '$or') {
          return value.some(condition => {
            for (const [condKey, condValue] of Object.entries(condition)) {
              if (typeof condValue === 'object' && condValue.$regex) {
                return new RegExp(condValue.$regex, condValue.$options || '').test(client[condKey] || '');
              }
              return client[condKey] === condValue;
            }
          });
        } else if (typeof value === 'object' && value.$regex) {
          if (!new RegExp(value.$regex, value.$options || '').test(client[key] || '')) {
            return false;
          }
        } else if (client[key] !== value) {
          return false;
        }
      }
      return true;
    });

    return filtered.length;
  }

  static async findById(id) {
    const instance = new Client({});
    const clients = await instance.loadClients();
    return clients.find(c => c.id == id);
  }

  static async findByPhone(phone) {
    const instance = new Client({});
    const clients = await instance.loadClients();
    return clients.find(c => c.phone === phone);
  }

  static async findExpiring(days = 7) {
    const instance = new Client({});
    const clients = await instance.loadClients();
    const today = new Date();
    
    return clients.filter(client => {
      if (client.status === 'suspended') return false;
      
      const expiryDate = new Date(client.expiry);
      const daysToExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
      
      return daysToExpiry >= 0 && daysToExpiry <= days;
    });
  }

  static async update(id, updateData) {
    const instance = new Client({});
    const clients = await instance.loadClients();
    
    const clientIndex = clients.findIndex(c => c.id == id);
    if (clientIndex === -1) {
      return null;
    }

    // Actualizar datos
    clients[clientIndex] = {
      ...clients[clientIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    await instance.saveClients(clients);
    return clients[clientIndex];
  }

  static async delete(id) {
    const instance = new Client({});
    const clients = await instance.loadClients();
    
    const clientIndex = clients.findIndex(c => c.id == id);
    if (clientIndex === -1) {
      return false;
    }

    clients.splice(clientIndex, 1);
    await instance.saveClients(clients);
    return true;
  }
}

module.exports = Client;