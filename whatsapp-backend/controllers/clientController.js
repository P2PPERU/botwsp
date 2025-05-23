const Client = require('../models/Client');
const logger = require('../utils/logger');
const whatsappService = require('../services/whatsappWebService');

class ClientController {
  // Obtener todos los clientes
  async getAll(req, res) {
    try {
      const { 
        page = 1, 
        limit = 50, 
        status, 
        service, 
        search,
        sortBy = 'name',
        sortOrder = 'asc'
      } = req.query;

      const filters = {};
      
      if (status) {
        filters.status = status;
      }
      
      if (service) {
        filters.service = { $regex: service, $options: 'i' };
      }
      
      if (search) {
        filters.$or = [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { service: { $regex: search, $options: 'i' } }
        ];
      }

      const clients = await Client.find(filters, page, limit, sortBy, sortOrder);
      const total = await Client.count(filters);
      
      // Calcular estadísticas adicionales
      const stats = {
        total: total,
        active: await Client.count({ ...filters, status: 'active' }),
        expiring: await Client.count({ ...filters, status: 'expiring' }),
        expired: await Client.count({ ...filters, status: 'expired' })
      };

      res.json({
        success: true,
        data: {
          clients: clients,
          stats: stats,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Error getting clients:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get clients',
        details: error.message
      });
    }
  }

  // Obtener cliente por ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const client = await Client.findById(id);
      
      if (!client) {
        return res.status(404).json({
          success: false,
          error: 'Client not found'
        });
      }

      res.json({
        success: true,
        data: client
      });
    } catch (error) {
      logger.error('Error getting client by ID:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get client',
        details: error.message
      });
    }
  }

  // Crear nuevo cliente
  async create(req, res) {
    try {
      const clientData = req.body;
      
      // Validaciones básicas
      if (!clientData.name || !clientData.phone || !clientData.service) {
        return res.status(400).json({
          success: false,
          error: 'Name, phone, and service are required'
        });
      }

      // Formatear número de teléfono
      clientData.phone = whatsappService.formatPhoneNumber(clientData.phone);
      
      // Verificar si el cliente ya existe
      const existingClient = await Client.findByPhone(clientData.phone);
      if (existingClient) {
        return res.status(409).json({
          success: false,
          error: 'Client with this phone number already exists'
        });
      }

      // Calcular estado basado en fecha de vencimiento
      if (clientData.expiry) {
        clientData.status = this.calculateStatus(clientData.expiry);
      }

      const newClient = new Client(clientData);
      await newClient.save();

      logger.success(`New client created: ${newClient.name} (${newClient.phone})`);
      
      res.status(201).json({
        success: true,
        data: newClient
      });
    } catch (error) {
      logger.error('Error creating client:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to create client',
        details: error.message
      });
    }
  }

  // Actualizar cliente
  async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Formatear teléfono si se está actualizando
      if (updateData.phone) {
        updateData.phone = whatsappService.formatPhoneNumber(updateData.phone);
      }

      // Calcular estado si se actualiza la fecha de vencimiento
      if (updateData.expiry) {
        updateData.status = this.calculateStatus(updateData.expiry);
      }

      const updatedClient = await Client.update(id, updateData);
      
      if (!updatedClient) {
        return res.status(404).json({
          success: false,
          error: 'Client not found'
        });
      }

      logger.info(`Client updated: ${updatedClient.name} (${updatedClient.phone})`);
      
      res.json({
        success: true,
        data: updatedClient
      });
    } catch (error) {
      logger.error('Error updating client:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to update client',
        details: error.message
      });
    }
  }

  // Eliminar cliente
  async delete(req, res) {
    try {
      const { id } = req.params;
      
      const deleted = await Client.delete(id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Client not found'
        });
      }

      logger.info(`Client deleted: ID ${id}`);
      
      res.json({
        success: true,
        data: {
          deletedId: id
        }
      });
    } catch (error) {
      logger.error('Error deleting client:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to delete client',
        details: error.message
      });
    }
  }

  // Obtener clientes próximos a vencer
  async getExpiring(req, res) {
    try {
      const { days = 7 } = req.query;
      
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + parseInt(days));
      
      const expiringClients = await Client.findExpiring(parseInt(days));
      
      res.json({
        success: true,
        data: {
          clients: expiringClients,
          count: expiringClients.length,
          days: parseInt(days)
        }
      });
    } catch (error) {
      logger.error('Error getting expiring clients:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get expiring clients',
        details: error.message
      });
    }
  }

  // Renovar suscripción de cliente
  async renewSubscription(req, res) {
    try {
      const { id } = req.params;
      const { months = 1, newExpiry } = req.body;
      
      const client = await Client.findById(id);
      if (!client) {
        return res.status(404).json({
          success: false,
          error: 'Client not found'
        });
      }

      let expiryDate;
      if (newExpiry) {
        expiryDate = new Date(newExpiry);
      } else {
        expiryDate = new Date(client.expiry);
        expiryDate.setMonth(expiryDate.getMonth() + months);
      }

      const updateData = {
        expiry: expiryDate.toISOString().split('T')[0],
        status: 'active',
        lastPayment: new Date().toISOString().split('T')[0]
      };

      const updatedClient = await Client.update(id, updateData);

      logger.success(`Subscription renewed for ${client.name} until ${updateData.expiry}`);
      
      res.json({
        success: true,
        data: updatedClient,
        message: 'Subscription renewed successfully'
      });
    } catch (error) {
      logger.error('Error renewing subscription:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to renew subscription',
        details: error.message
      });
    }
  }

  // Suspender cliente
  async suspend(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      const updatedClient = await Client.update(id, { 
        status: 'suspended',
        suspensionReason: reason,
        suspendedAt: new Date().toISOString()
      });
      
      if (!updatedClient) {
        return res.status(404).json({
          success: false,
          error: 'Client not found'
        });
      }

      logger.info(`Client suspended: ${updatedClient.name} - Reason: ${reason}`);
      
      res.json({
        success: true,
        data: updatedClient,
        message: 'Client suspended successfully'
      });
    } catch (error) {
      logger.error('Error suspending client:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to suspend client',
        details: error.message
      });
    }
  }

  // Reactivar cliente
  async reactivate(req, res) {
    try {
      const { id } = req.params;
      
      const client = await Client.findById(id);
      if (!client) {
        return res.status(404).json({
          success: false,
          error: 'Client not found'
        });
      }

      const status = this.calculateStatus(client.expiry);
      
      const updatedClient = await Client.update(id, { 
        status: status,
        suspensionReason: null,
        suspendedAt: null,
        reactivatedAt: new Date().toISOString()
      });

      logger.info(`Client reactivated: ${updatedClient.name}`);
      
      res.json({
        success: true,
        data: updatedClient,
        message: 'Client reactivated successfully'
      });
    } catch (error) {
      logger.error('Error reactivating client:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to reactivate client',
        details: error.message
      });
    }
  }

  // Importar clientes desde CSV/JSON
  async importClients(req, res) {
    try {
      const { clients } = req.body;
      
      if (!Array.isArray(clients)) {
        return res.status(400).json({
          success: false,
          error: 'Clients array is required'
        });
      }

      const results = {
        imported: 0,
        skipped: 0,
        errors: []
      };

      for (const clientData of clients) {
        try {
          // Validar datos requeridos
          if (!clientData.name || !clientData.phone || !clientData.service) {
            results.errors.push({
              data: clientData,
              error: 'Missing required fields'
            });
            continue;
          }

          // Formatear teléfono
          clientData.phone = whatsappService.formatPhoneNumber(clientData.phone);
          
          // Verificar si ya existe
          const existing = await Client.findByPhone(clientData.phone);
          if (existing) {
            results.skipped++;
            continue;
          }

          // Calcular estado
          if (clientData.expiry) {
            clientData.status = this.calculateStatus(clientData.expiry);
          }

          const newClient = new Client(clientData);
          await newClient.save();
          results.imported++;
        } catch (error) {
          results.errors.push({
            data: clientData,
            error: error.message
          });
        }
      }

      logger.success(`Import completed: ${results.imported} imported, ${results.skipped} skipped, ${results.errors.length} errors`);
      
      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      logger.error('Error importing clients:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to import clients',
        details: error.message
      });
    }
  }

  // Calcular estado basado en fecha de vencimiento
  calculateStatus(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysToExpiry = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (daysToExpiry < 0) {
      return 'expired';
    } else if (daysToExpiry <= 3) {
      return 'expiring';
    } else {
      return 'active';
    }
  }
}

module.exports = new ClientController();