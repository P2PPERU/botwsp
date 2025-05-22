const fs = require('fs');
const path = require('path');

// Base de datos en archivo JSON (temporal)
const DB_PATH = path.join(__dirname, '../data/messages.json');

class Message {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.from = data.from;
    this.to = data.to;
    this.message = data.message;
    this.type = data.type || 'text'; // text, file, image, audio, video
    this.status = data.status || 'sent'; // sent, delivered, read, failed
    this.fromMe = data.fromMe || false;
    this.timestamp = data.timestamp || Date.now();
    this.time = data.time || new Date().toLocaleTimeString();
    this.bulkId = data.bulkId || null;
    this.fileData = data.fileData || null;
    this.readAt = data.readAt || null;
    this.deliveredAt = data.deliveredAt || null;
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  // Generar ID único
  generateId() {
    return `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }

  // Guardar mensaje
  async save() {
    const messages = await this.loadMessages();
    
    // Si existe, actualizar
    const existingIndex = messages.findIndex(m => m.id === this.id);
    if (existingIndex !== -1) {
      messages[existingIndex] = this;
    } else {
      // Si es nuevo, agregar al inicio (más recientes primero)
      messages.unshift(this);
    }

    // Mantener solo los últimos 1000 mensajes para evitar que el archivo crezca mucho
    if (messages.length > 1000) {
      messages.splice(1000);
    }

    await this.saveMessages(messages);
    return this;
  }

  // Cargar mensajes desde archivo
  async loadMessages() {
    try {
      if (!fs.existsSync(DB_PATH)) {
        // Crear archivo con datos de ejemplo si no existe
        const defaultMessages = [
          {
            id: 'msg_1',
            from: '51987654321',
            to: 'tes4',
            message: 'Hola, necesito información sobre Netflix',
            type: 'text',
            status: 'delivered',
            fromMe: false,
            timestamp: Date.now() - 600000, // 10 minutos atrás
            time: new Date(Date.now() - 600000).toLocaleTimeString(),
            createdAt: new Date(Date.now() - 600000).toISOString()
          },
          {
            id: 'msg_2',
            from: 'tes4',
            to: '51987654321',
            message: '¡Hola! Te ayudo con información sobre nuestros planes de Netflix Premium.',
            type: 'text',
            status: 'read',
            fromMe: true,
            timestamp: Date.now() - 580000, // 9.5 minutos atrás
            time: new Date(Date.now() - 580000).toLocaleTimeString(),
            createdAt: new Date(Date.now() - 580000).toISOString()
          },
          {
            id: 'msg_3',
            from: '51923456789',
            to: 'tes4',
            message: 'Mi suscripción vence mañana, ¿puedo renovar?',
            type: 'text',
            status: 'delivered',
            fromMe: false,
            timestamp: Date.now() - 300000, // 5 minutos atrás
            time: new Date(Date.now() - 300000).toLocaleTimeString(),
            createdAt: new Date(Date.now() - 300000).toISOString()
          }
        ];
        
        // Crear directorio si no existe
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(DB_PATH, JSON.stringify(defaultMessages, null, 2));
        return defaultMessages;
      }

      const data = fs.readFileSync(DB_PATH, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading messages:', error);
      return [];
    }
  }

  // Guardar mensajes en archivo
  async saveMessages(messages) {
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(DB_PATH, JSON.stringify(messages, null, 2));
    } catch (error) {
      console.error('Error saving messages:', error);
      throw error;
    }
  }

  // Métodos estáticos
  static async findAll() {
    const instance = new Message({});
    return await instance.loadMessages();
  }

  static async find(filters = {}, page = 1, limit = 50) {
    const instance = new Message({});
    let messages = await instance.loadMessages();

    // Aplicar filtros
    if (Object.keys(filters).length > 0) {
      messages = messages.filter(message => {
        for (const [key, value] of Object.entries(filters)) {
          if (key === '$or') {
            // Manejo especial para búsqueda OR
            return value.some(condition => {
              for (const [condKey, condValue] of Object.entries(condition)) {
                return message[condKey] === condValue;
              }
            });
          } else if (key === 'timestamp' && typeof value === 'object') {
            // Manejo de rangos de fecha
            if (value.$gte && message.timestamp < new Date(value.$gte).getTime()) {
              return false;
            }
            if (value.$lte && message.timestamp > new Date(value.$lte).getTime()) {
              return false;
            }
          } else if (message[key] !== value) {
            return false;
          }
        }
        return true;
      });
    }

    // Los mensajes ya están ordenados por timestamp (más recientes primero)
    
    // Paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return messages.slice(startIndex, endIndex);
  }

  static async count(filters = {}) {
    const instance = new Message({});
    let messages = await instance.loadMessages();

    if (Object.keys(filters).length === 0) {
      return messages.length;
    }

    // Aplicar los mismos filtros que en find()
    const filtered = messages.filter(message => {
      for (const [key, value] of Object.entries(filters)) {
        if (key === '$or') {
          return value.some(condition => {
            for (const [condKey, condValue] of Object.entries(condition)) {
              return message[condKey] === condValue;
            }
          });
        } else if (key === 'timestamp' && typeof value === 'object') {
          if (value.$gte && message.timestamp < new Date(value.$gte).getTime()) {
            return false;
          }
          if (value.$lte && message.timestamp > new Date(value.$lte).getTime()) {
            return false;
          }
        } else if (message[key] !== value) {
          return false;
        }
      }
      return true;
    });

    return filtered.length;
  }

  static async findById(id) {
    const instance = new Message({});
    const messages = await instance.loadMessages();
    return messages.find(m => m.id === id);
  }

  static async updateMany(filters, updateData) {
    const instance = new Message({});
    const messages = await instance.loadMessages();
    
    let updatedCount = 0;
    
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      let shouldUpdate = true;
      
      // Verificar filtros
      for (const [key, value] of Object.entries(filters)) {
        if (key === 'id' && typeof value === 'object' && value.$in) {
          if (!value.$in.includes(message.id)) {
            shouldUpdate = false;
            break;
          }
        } else if (message[key] !== value) {
          shouldUpdate = false;
          break;
        }
      }
      
      if (shouldUpdate) {
        messages[i] = { ...message, ...updateData };
        updatedCount++;
      }
    }
    
    if (updatedCount > 0) {
      await instance.saveMessages(messages);
    }
    
    return updatedCount;
  }

  static async delete(id) {
    const instance = new Message({});
    const messages = await instance.loadMessages();
    
    const messageIndex = messages.findIndex(m => m.id === id);
    if (messageIndex === -1) {
      return false;
    }

    messages.splice(messageIndex, 1);
    await instance.saveMessages(messages);
    return true;
  }

  // Limpiar mensajes antiguos
  static async cleanOldMessages(days = 30) {
    const instance = new Message({});
    const messages = await instance.loadMessages();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffTimestamp = cutoffDate.getTime();
    
    const filteredMessages = messages.filter(m => m.timestamp > cutoffTimestamp);
    
    if (filteredMessages.length !== messages.length) {
      await instance.saveMessages(filteredMessages);
      return messages.length - filteredMessages.length; // Número de mensajes eliminados
    }
    
    return 0;
  }
}

module.exports = Message;