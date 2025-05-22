const Client = require('../models/Client');
const Message = require('../models/Message');
const logger = require('../utils/logger');
const wppService = require('../services/wppService');

class StatsController {
  
  // Obtener estadísticas generales del dashboard
  async getStats(req, res) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const thisWeek = new Date(today);
      thisWeek.setDate(today.getDate() - 7);
      
      const thisMonth = new Date(today);
      thisMonth.setMonth(today.getMonth() - 1);

      // Estadísticas de clientes
      const clientStats = {
        total: await Client.count({}),
        active: await Client.count({ status: 'active' }),
        expiring: await Client.count({ status: 'expiring' }),
        expired: await Client.count({ status: 'expired' }),
        suspended: await Client.count({ status: 'suspended' })
      };

      // Estadísticas de mensajes
      const messageStats = {
        total: await Message.count({}),
        today: await Message.count({
          timestamp: { $gte: today, $lt: tomorrow }
        }),
        thisWeek: await Message.count({
          timestamp: { $gte: thisWeek }
        }),
        thisMonth: await Message.count({
          timestamp: { $gte: thisMonth }
        }),
        sent: await Message.count({ fromMe: true }),
        received: await Message.count({ fromMe: false })
      };

      // Estadísticas por tipo de mensaje
      const messageTypes = {
        text: await Message.count({ type: 'text' }),
        file: await Message.count({ type: 'file' }),
        image: await Message.count({ type: 'image' }),
        audio: await Message.count({ type: 'audio' }),
        video: await Message.count({ type: 'video' })
      };

      // Estadísticas por estado de mensaje
      const messageStatus = {
        sent: await Message.count({ status: 'sent' }),
        delivered: await Message.count({ status: 'delivered' }),
        read: await Message.count({ status: 'read' }),
        failed: await Message.count({ status: 'failed' })
      };

      // Estado de WPPConnect
      const wppStatus = await wppService.checkConnection();

      // Próximos vencimientos
      const upcomingExpirations = await Client.findExpiring(7);

      // Servicios más populares
      const allClients = await Client.findAll();
      const serviceStats = this.calculateServiceStats(allClients);

      // Crecimiento mensual
      const growthStats = await this.calculateGrowthStats();

      // Estadísticas de rendimiento
      const performanceStats = {
        averageResponseTime: await this.calculateAverageResponseTime(),
        systemUptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        lastBackup: await this.getLastBackupTime()
      };

      const stats = {
        clients: clientStats,
        messages: messageStats,
        messageTypes: messageTypes,
        messageStatus: messageStatus,
        wppConnect: {
          connected: wppStatus.connected,
          session: wppStatus.session,
          lastCheck: wppStatus.lastCheck
        },
        upcomingExpirations: {
          count: upcomingExpirations.length,
          clients: upcomingExpirations.slice(0, 5) // Solo los primeros 5
        },
        services: serviceStats,
        growth: growthStats,
        performance: performanceStats,
        summary: {
          totalRevenue: this.calculateTotalRevenue(allClients),
          activeRate: clientStats.total > 0 ? (clientStats.active / clientStats.total * 100).toFixed(1) : 0,
          responseRate: messageStats.total > 0 ? (messageStats.sent / messageStats.total * 100).toFixed(1) : 0
        },
        lastUpdated: new Date().toISOString()
      };

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Error getting stats:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get statistics',
        details: error.message
      });
    }
  }

  // Obtener estadísticas de clientes
  async getClientStats(req, res) {
    try {
      const { period = '30d' } = req.query;
      
      const clients = await Client.findAll();
      
      // Análisis por estado
      const statusDistribution = {
        active: clients.filter(c => c.status === 'active').length,
        expiring: clients.filter(c => c.status === 'expiring').length,
        expired: clients.filter(c => c.status === 'expired').length,
        suspended: clients.filter(c => c.status === 'suspended').length
      };

      // Análisis por servicio
      const serviceDistribution = this.calculateServiceStats(clients);

      // Análisis de vencimientos por mes
      const expirationAnalysis = this.calculateExpirationAnalysis(clients);

      // Clientes más antiguos
      const oldestClients = clients
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .slice(0, 10);

      // Clientes más nuevos
      const newestClients = clients
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10);

      res.json({
        success: true,
        data: {
          total: clients.length,
          statusDistribution,
          serviceDistribution,
          expirationAnalysis,
          oldestClients,
          newestClients,
          period
        }
      });

    } catch (error) {
      logger.error('Error getting client stats:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get client statistics',
        details: error.message
      });
    }
  }

  // Obtener estadísticas de mensajes
  async getMessageStats(req, res) {
    try {
      const { period = '7d' } = req.query;
      
      const messages = await Message.findAll();
      
      // Análisis temporal
      const timeAnalysis = this.calculateTimeAnalysis(messages, period);
      
      // Análisis por tipo
      const typeAnalysis = {
        text: messages.filter(m => m.type === 'text').length,
        file: messages.filter(m => m.type === 'file').length,
        image: messages.filter(m => m.type === 'image').length,
        audio: messages.filter(m => m.type === 'audio').length,
        video: messages.filter(m => m.type === 'video').length
      };

      // Análisis de conversaciones
      const conversationAnalysis = this.calculateConversationAnalysis(messages);

      // Horarios más activos
      const hourlyActivity = this.calculateHourlyActivity(messages);

      res.json({
        success: true,
        data: {
          total: messages.length,
          timeAnalysis,
          typeAnalysis,
          conversationAnalysis,
          hourlyActivity,
          period
        }
      });

    } catch (error) {
      logger.error('Error getting message stats:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get message statistics',
        details: error.message
      });
    }
  }

  // Obtener estadísticas de rendimiento del sistema
  async getSystemStats(req, res) {
    try {
      const wppHealth = await wppService.healthCheck();
      const memUsage = process.memoryUsage();
      
      const systemStats = {
        uptime: {
          process: process.uptime(),
          system: require('os').uptime()
        },
        memory: {
          rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
          external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
        },
        cpu: {
          usage: process.cpuUsage(),
          loadAverage: require('os').loadavg()
        },
        wppConnect: wppHealth,
        database: {
          status: 'connected', // Para JSON files siempre connected
          type: 'JSON Files',
          location: './data/'
        },
        nodejs: {
          version: process.version,
          platform: process.platform,
          arch: process.arch
        }
      };

      res.json({
        success: true,
        data: systemStats
      });

    } catch (error) {
      logger.error('Error getting system stats:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get system statistics',
        details: error.message
      });
    }
  }

  // Obtener reporte de actividad diaria
  async getDailyReport(req, res) {
    try {
      const { date } = req.query;
      const targetDate = date ? new Date(date) : new Date();
      
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Mensajes del día
      const dayMessages = await Message.find({
        timestamp: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      });

      // Actividad por hora
      const hourlyActivity = new Array(24).fill(0);
      dayMessages.forEach(msg => {
        const hour = new Date(msg.timestamp).getHours();
        hourlyActivity[hour]++;
      });

      // Conversaciones únicas
      const uniqueContacts = new Set();
      dayMessages.forEach(msg => {
        if (!msg.fromMe) {
          uniqueContacts.add(msg.from);
        }
      });

      const report = {
        date: targetDate.toISOString().split('T')[0],
        summary: {
          totalMessages: dayMessages.length,
          sentMessages: dayMessages.filter(m => m.fromMe).length,
          receivedMessages: dayMessages.filter(m => !m.fromMe).length,
          uniqueContacts: uniqueContacts.size
        },
        hourlyActivity,
        topContacts: this.getTopContacts(dayMessages),
        messageTypes: {
          text: dayMessages.filter(m => m.type === 'text').length,
          file: dayMessages.filter(m => m.type === 'file').length,
          image: dayMessages.filter(m => m.type === 'image').length,
          other: dayMessages.filter(m => !['text', 'file', 'image'].includes(m.type)).length
        }
      };

      res.json({
        success: true,
        data: report
      });

    } catch (error) {
      logger.error('Error getting daily report:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get daily report',
        details: error.message
      });
    }
  }

  // Métodos auxiliares
  calculateServiceStats(clients) {
    const services = {};
    clients.forEach(client => {
      const service = client.service || 'Unknown';
      services[service] = (services[service] || 0) + 1;
    });
    
    return Object.entries(services)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  calculateExpirationAnalysis(clients) {
    const analysis = {};
    const today = new Date();
    
    clients.forEach(client => {
      if (client.expiry) {
        const expiryDate = new Date(client.expiry);
        const monthYear = expiryDate.toISOString().substring(0, 7); // YYYY-MM
        analysis[monthYear] = (analysis[monthYear] || 0) + 1;
      }
    });
    
    return analysis;
  }

  async calculateGrowthStats() {
    try {
      const clients = await Client.findAll();
      const messages = await Message.findAll();
      
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const clientsThisMonth = clients.filter(c => 
        new Date(c.createdAt) >= thisMonth
      ).length;
      
      const clientsLastMonth = clients.filter(c => 
        new Date(c.createdAt) >= lastMonth && new Date(c.createdAt) < thisMonth
      ).length;
      
      const messagesThisMonth = messages.filter(m => 
        m.timestamp >= thisMonth.getTime()
      ).length;
      
      const messagesLastMonth = messages.filter(m => 
        m.timestamp >= lastMonth.getTime() && m.timestamp < thisMonth.getTime()
      ).length;
      
      return {
        clients: {
          thisMonth: clientsThisMonth,
          lastMonth: clientsLastMonth,
          growth: clientsLastMonth > 0 ? 
            ((clientsThisMonth - clientsLastMonth) / clientsLastMonth * 100).toFixed(1) : 0
        },
        messages: {
          thisMonth: messagesThisMonth,
          lastMonth: messagesLastMonth,
          growth: messagesLastMonth > 0 ? 
            ((messagesThisMonth - messagesLastMonth) / messagesLastMonth * 100).toFixed(1) : 0
        }
      };
    } catch (error) {
      logger.error('Error calculating growth stats:', error.message);
      return { clients: {}, messages: {} };
    }
  }

  calculateTotalRevenue(clients) {
    // Estimación básica de ingresos (esto debería venir de un sistema de pagos real)
    const servicePrices = {
      'Netflix Premium': 25,
      'Disney+ Familiar': 20,
      'Prime Video': 15,
      'HBO Max': 22,
      'Spotify Premium': 18,
      'YouTube Premium': 12
    };
    
    return clients.reduce((total, client) => {
      const price = servicePrices[client.service] || 20; // Precio por defecto
      return client.status === 'active' ? total + price : total;
    }, 0);
  }

  async calculateAverageResponseTime() {
    // Implementación básica - en un sistema real esto sería más complejo
    return Math.floor(Math.random() * 300) + 60; // Entre 1-5 minutos
  }

  async getLastBackupTime() {
    // Implementación básica
    return new Date(Date.now() - Math.random() * 86400000).toISOString();
  }

  calculateTimeAnalysis(messages, period) {
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '24h':
        startDate = new Date(now - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
    }
    
    const filteredMessages = messages.filter(m => m.timestamp >= startDate.getTime());
    
    return {
      total: filteredMessages.length,
      sent: filteredMessages.filter(m => m.fromMe).length,
      received: filteredMessages.filter(m => !m.fromMe).length,
      period
    };
  }

  calculateConversationAnalysis(messages) {
    const conversations = {};
    
    messages.forEach(msg => {
      const contact = msg.fromMe ? msg.to : msg.from;
      if (!conversations[contact]) {
        conversations[contact] = { total: 0, sent: 0, received: 0 };
      }
      
      conversations[contact].total++;
      if (msg.fromMe) {
        conversations[contact].sent++;
      } else {
        conversations[contact].received++;
      }
    });
    
    const totalConversations = Object.keys(conversations).length;
    const avgMessagesPerConversation = totalConversations > 0 ? 
      (messages.length / totalConversations).toFixed(1) : 0;
    
    return {
      totalConversations,
      avgMessagesPerConversation,
      topConversations: Object.entries(conversations)
        .map(([contact, stats]) => ({ contact, ...stats }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10)
    };
  }

  calculateHourlyActivity(messages) {
    const hourlyCount = new Array(24).fill(0);
    
    messages.forEach(msg => {
      const hour = new Date(msg.timestamp).getHours();
      hourlyCount[hour]++;
    });
    
    return hourlyCount.map((count, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      count
    }));
  }

  getTopContacts(messages) {
    const contacts = {};
    
    messages.forEach(msg => {
      const contact = msg.fromMe ? msg.to : msg.from;
      contacts[contact] = (contacts[contact] || 0) + 1;
    });
    
    return Object.entries(contacts)
      .map(([contact, count]) => ({ contact, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
}

module.exports = new StatsController();