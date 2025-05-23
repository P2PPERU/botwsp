const metricsService = require('../services/metricsService');
const logger = require('../utils/logger');

class MetricsController {
  // Obtener resumen de métricas
  async getSummary(req, res) {
    try {
      const summary = metricsService.getSummary();
      
      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      logger.error('Error getting metrics summary:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get metrics summary',
        details: error.message
      });
    }
  }

  // Obtener métricas detalladas
  async getDetailed(req, res) {
    try {
      const detailed = metricsService.getDetailedMetrics();
      
      res.json({
        success: true,
        data: detailed
      });
    } catch (error) {
      logger.error('Error getting detailed metrics:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get detailed metrics',
        details: error.message
      });
    }
  }

  // Obtener actividad por hora
  async getHourlyActivity(req, res) {
    try {
      const activity = metricsService.getHourlyActivity();
      
      res.json({
        success: true,
        data: {
          activity,
          date: new Date().toISOString().split('T')[0]
        }
      });
    } catch (error) {
      logger.error('Error getting hourly activity:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get hourly activity',
        details: error.message
      });
    }
  }

  // Obtener histórico de métricas
  async getHistorical(req, res) {
    try {
      const { days = 7 } = req.query;
      const historical = await metricsService.getHistoricalMetrics(parseInt(days));
      
      res.json({
        success: true,
        data: {
          historical,
          days: parseInt(days)
        }
      });
    } catch (error) {
      logger.error('Error getting historical metrics:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get historical metrics',
        details: error.message
      });
    }
  }

  // Obtener métricas de costos
  async getCosts(req, res) {
    try {
      const metrics = metricsService.getDetailedMetrics();
      
      const costs = {
        gpt: {
          today: {
            tokens: metrics.gpt.tokens.today,
            cost: `$${metrics.gpt.cost.today.toFixed(4)}`,
            requests: metrics.gpt.requests.today
          },
          total: {
            tokens: metrics.gpt.tokens.total,
            cost: `$${metrics.gpt.cost.total.toFixed(2)}`,
            requests: metrics.gpt.requests.total
          },
          projection: {
            daily: `$${(metrics.gpt.cost.today).toFixed(2)}`,
            monthly: `$${(metrics.gpt.cost.today * 30).toFixed(2)}`,
            yearly: `$${(metrics.gpt.cost.today * 365).toFixed(2)}`
          }
        },
        messaging: {
          sent: metrics.messages.sent.total,
          received: metrics.messages.received.total,
          failed: metrics.messages.sent.failed
        }
      };
      
      res.json({
        success: true,
        data: costs
      });
    } catch (error) {
      logger.error('Error getting cost metrics:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get cost metrics',
        details: error.message
      });
    }
  }

  // Obtener métricas de errores
  async getErrors(req, res) {
    try {
      const { limit = 50 } = req.query;
      const metrics = metricsService.getDetailedMetrics();
      
      const errors = {
        summary: {
          total: metrics.errors.total,
          today: metrics.errors.today,
          byType: metrics.errors.byType
        },
        recent: metrics.errors.recent.slice(0, parseInt(limit))
      };
      
      res.json({
        success: true,
        data: errors
      });
    } catch (error) {
      logger.error('Error getting error metrics:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get error metrics',
        details: error.message
      });
    }
  }

  // Obtener estado del sistema
  async getSystemStatus(req, res) {
    try {
      const metrics = metricsService.getDetailedMetrics();
      const summary = metricsService.getSummary();
      
      // Calcular health score
      const healthScore = this.calculateHealthScore(metrics);
      
      const status = {
        health: {
          score: healthScore,
          status: healthScore > 90 ? 'excellent' : healthScore > 70 ? 'good' : healthScore > 50 ? 'fair' : 'poor'
        },
        services: {
          whatsapp: {
            status: metrics.whatsapp.status,
            uptime: summary.whatsapp.uptime,
            lastCheck: summary.whatsapp.lastCheck
          },
          gpt: {
            operational: metrics.gpt.requests.failed < metrics.gpt.requests.total * 0.1,
            responseTime: summary.gpt.avgResponseTime,
            costToday: summary.gpt.costToday
          },
          api: {
            operational: true,
            requestsToday: metrics.api.requests.today,
            avgResponseTime: summary.api.avgResponseTime
          }
        },
        uptime: summary.uptime,
        lastUpdate: summary.lastUpdate
      };
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Error getting system status:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get system status',
        details: error.message
      });
    }
  }

  // Dashboard de métricas en tiempo real
  async getDashboard(req, res) {
    try {
      const summary = metricsService.getSummary();
      const detailed = metricsService.getDetailedMetrics();
      
      // Preparar datos para dashboard
      const dashboard = {
        overview: {
          messagesTotal: summary.messages.sent.total + summary.messages.received.total,
          messagesToday: summary.messages.sent.today + summary.messages.received.today,
          gptCostToday: summary.gpt.costToday,
          whatsappStatus: summary.whatsapp.status,
          errorsToday: summary.errors.today,
          uptime: summary.uptime.formatted
        },
        charts: {
          hourlyActivity: metricsService.getHourlyActivity(),
          messageDistribution: {
            sent: summary.messages.sent.total,
            received: summary.messages.received.total,
            failed: summary.messages.sent.failed
          },
          gptUsage: {
            cacheHits: detailed.gpt.cache.hits,
            cacheMisses: detailed.gpt.cache.misses
          },
          apiStatus: Object.entries(detailed.api.statusCodes).map(([code, count]) => ({
            code,
            count
          }))
        },
        alerts: this.generateAlerts(detailed),
        timestamp: new Date().toISOString()
      };
      
      res.json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      logger.error('Error getting dashboard data:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get dashboard data',
        details: error.message
      });
    }
  }

  // Exportar métricas
  async exportMetrics(req, res) {
    try {
      const { format = 'json', days = 7 } = req.query;
      
      const detailed = metricsService.getDetailedMetrics();
      const historical = await metricsService.getHistoricalMetrics(parseInt(days));
      
      const exportData = {
        current: detailed,
        historical: historical,
        exported: new Date().toISOString(),
        period: `${days} days`
      };
      
      if (format === 'csv') {
        // Convertir a CSV (simplificado)
        const csv = this.convertToCSV(exportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=metrics-${Date.now()}.csv`);
        res.send(csv);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=metrics-${Date.now()}.json`);
        res.json(exportData);
      }
    } catch (error) {
      logger.error('Error exporting metrics:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to export metrics',
        details: error.message
      });
    }
  }

  // === MÉTODOS AUXILIARES ===

  calculateHealthScore(metrics) {
    let score = 100;
    
    // Penalizar por errores
    if (metrics.errors.today > 10) score -= 10;
    if (metrics.errors.today > 50) score -= 20;
    
    // Penalizar por fallos de mensajes
    const messageFailRate = metrics.messages.sent.failed / metrics.messages.sent.total;
    if (messageFailRate > 0.05) score -= 10;
    if (messageFailRate > 0.1) score -= 20;
    
    // Penalizar por WhatsApp desconectado
    if (metrics.whatsapp.status !== 'connected') score -= 30;
    
    // Penalizar por alto tiempo de respuesta
    if (metrics.api.responseTime.average > 1000) score -= 10;
    if (metrics.gpt.responseTime.average > 5000) score -= 10;
    
    return Math.max(0, score);
  }

  generateAlerts(metrics) {
    const alerts = [];
    
    // WhatsApp desconectado
    if (metrics.whatsapp.status !== 'connected') {
      alerts.push({
        level: 'critical',
        message: 'WhatsApp is disconnected',
        timestamp: Date.now()
      });
    }
    
    // Alto costo de GPT
    if (metrics.gpt.cost.today > 5) {
      alerts.push({
        level: 'warning',
        message: `High GPT costs today: $${metrics.gpt.cost.today.toFixed(2)}`,
        timestamp: Date.now()
      });
    }
    
    // Muchos errores
    if (metrics.errors.today > 50) {
      alerts.push({
        level: 'warning',
        message: `High error rate: ${metrics.errors.today} errors today`,
        timestamp: Date.now()
      });
    }
    
    // Alto fallo de mensajes
    const failRate = metrics.messages.sent.failed / metrics.messages.sent.total;
    if (failRate > 0.1) {
      alerts.push({
        level: 'warning',
        message: `High message failure rate: ${(failRate * 100).toFixed(1)}%`,
        timestamp: Date.now()
      });
    }
    
    return alerts;
  }

  convertToCSV(data) {
    // Implementación simplificada de conversión a CSV
    const rows = [];
    rows.push('Metric,Value,Timestamp');
    
    rows.push(`Messages Sent,${data.current.messages.sent.total},${data.exported}`);
    rows.push(`Messages Received,${data.current.messages.received.total},${data.exported}`);
    rows.push(`GPT Requests,${data.current.gpt.requests.total},${data.exported}`);
    rows.push(`GPT Cost,$${data.current.gpt.cost.total.toFixed(2)},${data.exported}`);
    rows.push(`Total Errors,${data.current.errors.total},${data.exported}`);
    
    return rows.join('\n');
  }
}

module.exports = new MetricsController();