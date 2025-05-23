const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class MetricsService {
  constructor() {
    this.metricsFile = path.join(__dirname, '../data/metrics.json');
    this.currentMetrics = this.loadMetrics();
    
    // Guardar métricas cada 5 minutos
    setInterval(() => {
      this.saveMetrics();
    }, 5 * 60 * 1000);
    
    // Rotar métricas diariamente
    setInterval(() => {
      this.rotateMetrics();
    }, 24 * 60 * 60 * 1000);
  }

  // Cargar métricas existentes
  loadMetrics() {
    try {
      if (fs.existsSync(this.metricsFile)) {
        const data = fs.readFileSync(this.metricsFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      logger.error('Error loading metrics:', error.message);
    }
    
    return this.getDefaultMetrics();
  }

  // Estructura de métricas por defecto
  getDefaultMetrics() {
    return {
      messages: {
        sent: { total: 0, today: 0, failed: 0, byHour: {} },
        received: { total: 0, today: 0, byHour: {} }
      },
      gpt: {
        requests: { total: 0, today: 0, failed: 0 },
        tokens: { total: 0, today: 0 },
        cost: { total: 0, today: 0 },
        responseTime: { total: 0, count: 0, average: 0 },
        cache: { hits: 0, misses: 0 }
      },
      whatsapp: {
        connections: { total: 0, successful: 0, failed: 0 },
        uptime: { start: Date.now(), disconnections: [] },
        status: 'disconnected',
        lastCheck: null
      },
      clients: {
        total: 0,
        active: 0,
        expiring: 0,
        expired: 0,
        byService: {}
      },
      errors: {
        total: 0,
        today: 0,
        byType: {},
        recent: []
      },
      api: {
        requests: { total: 0, today: 0, byEndpoint: {} },
        responseTime: { total: 0, count: 0, average: 0 },
        statusCodes: {}
      },
      system: {
        startTime: Date.now(),
        lastUpdate: Date.now()
      }
    };
  }

  // === MÉTODOS DE REGISTRO ===

  // Registrar mensaje enviado
  recordMessageSent(phone, status = 'success') {
    const hour = new Date().getHours();
    
    this.currentMetrics.messages.sent.total++;
    this.currentMetrics.messages.sent.today++;
    
    if (status === 'failed') {
      this.currentMetrics.messages.sent.failed++;
    }
    
    if (!this.currentMetrics.messages.sent.byHour[hour]) {
      this.currentMetrics.messages.sent.byHour[hour] = 0;
    }
    this.currentMetrics.messages.sent.byHour[hour]++;
    
    this.updateTimestamp();
  }

  // Registrar mensaje recibido
  recordMessageReceived(phone) {
    const hour = new Date().getHours();
    
    this.currentMetrics.messages.received.total++;
    this.currentMetrics.messages.received.today++;
    
    if (!this.currentMetrics.messages.received.byHour[hour]) {
      this.currentMetrics.messages.received.byHour[hour] = 0;
    }
    this.currentMetrics.messages.received.byHour[hour]++;
    
    this.updateTimestamp();
  }

  // Registrar uso de GPT
  recordGPTUsage(tokens, responseTime, cached = false) {
    this.currentMetrics.gpt.requests.total++;
    this.currentMetrics.gpt.requests.today++;
    
    if (cached) {
      this.currentMetrics.gpt.cache.hits++;
    } else {
      this.currentMetrics.gpt.cache.misses++;
      
      // Registrar tokens y costo solo si no es cache
      this.currentMetrics.gpt.tokens.total += tokens;
      this.currentMetrics.gpt.tokens.today += tokens;
      
      // Calcular costo (GPT-3.5: $0.002 per 1K tokens)
      const cost = (tokens / 1000) * 0.002;
      this.currentMetrics.gpt.cost.total += cost;
      this.currentMetrics.gpt.cost.today += cost;
    }
    
    // Actualizar tiempo de respuesta promedio
    this.currentMetrics.gpt.responseTime.total += responseTime;
    this.currentMetrics.gpt.responseTime.count++;
    this.currentMetrics.gpt.responseTime.average = 
      this.currentMetrics.gpt.responseTime.total / this.currentMetrics.gpt.responseTime.count;
    
    this.updateTimestamp();
  }

  // Registrar error de GPT
  recordGPTError() {
    this.currentMetrics.gpt.requests.failed++;
    this.recordError('gpt_api_error', 'GPT API request failed');
  }

  // Registrar estado de WhatsApp
  recordWhatsAppStatus(connected) {
    this.currentMetrics.whatsapp.status = connected ? 'connected' : 'disconnected';
    this.currentMetrics.whatsapp.lastCheck = Date.now();
    
    if (!connected && this.currentMetrics.whatsapp.status === 'connected') {
      this.currentMetrics.whatsapp.uptime.disconnections.push({
        timestamp: Date.now(),
        duration: 0
      });
    }
    
    this.updateTimestamp();
  }

  // Registrar conexión de WhatsApp
  recordWhatsAppConnection(successful) {
    this.currentMetrics.whatsapp.connections.total++;
    if (successful) {
      this.currentMetrics.whatsapp.connections.successful++;
      this.currentMetrics.whatsapp.status = 'connected';
    } else {
      this.currentMetrics.whatsapp.connections.failed++;
    }
    
    this.updateTimestamp();
  }

  // Registrar error
  recordError(type, message, details = null) {
    this.currentMetrics.errors.total++;
    this.currentMetrics.errors.today++;
    
    if (!this.currentMetrics.errors.byType[type]) {
      this.currentMetrics.errors.byType[type] = 0;
    }
    this.currentMetrics.errors.byType[type]++;
    
    // Guardar últimos 50 errores
    this.currentMetrics.errors.recent.unshift({
      type,
      message,
      details,
      timestamp: Date.now()
    });
    
    if (this.currentMetrics.errors.recent.length > 50) {
      this.currentMetrics.errors.recent = this.currentMetrics.errors.recent.slice(0, 50);
    }
    
    this.updateTimestamp();
  }

  // Registrar request de API
  recordAPIRequest(endpoint, method, statusCode, responseTime) {
    this.currentMetrics.api.requests.total++;
    this.currentMetrics.api.requests.today++;
    
    const key = `${method} ${endpoint}`;
    if (!this.currentMetrics.api.requests.byEndpoint[key]) {
      this.currentMetrics.api.requests.byEndpoint[key] = 0;
    }
    this.currentMetrics.api.requests.byEndpoint[key]++;
    
    if (!this.currentMetrics.api.statusCodes[statusCode]) {
      this.currentMetrics.api.statusCodes[statusCode] = 0;
    }
    this.currentMetrics.api.statusCodes[statusCode]++;
    
    this.currentMetrics.api.responseTime.total += responseTime;
    this.currentMetrics.api.responseTime.count++;
    this.currentMetrics.api.responseTime.average = 
      this.currentMetrics.api.responseTime.total / this.currentMetrics.api.responseTime.count;
    
    this.updateTimestamp();
  }

  // Actualizar estadísticas de clientes
  updateClientStats(stats) {
    this.currentMetrics.clients = {
      ...this.currentMetrics.clients,
      ...stats
    };
    this.updateTimestamp();
  }

  // === MÉTODOS DE CONSULTA ===

  // Obtener resumen de métricas
  getSummary() {
    const uptime = Date.now() - this.currentMetrics.system.startTime;
    const uptimeHours = Math.floor(uptime / (1000 * 60 * 60));
    const uptimeDays = Math.floor(uptimeHours / 24);
    
    return {
      uptime: {
        days: uptimeDays,
        hours: uptimeHours % 24,
        formatted: `${uptimeDays}d ${uptimeHours % 24}h`
      },
      messages: {
        sent: {
          total: this.currentMetrics.messages.sent.total,
          today: this.currentMetrics.messages.sent.today,
          failed: this.currentMetrics.messages.sent.failed,
          successRate: this.calculateSuccessRate()
        },
        received: {
          total: this.currentMetrics.messages.received.total,
          today: this.currentMetrics.messages.received.today
        }
      },
      gpt: {
        requests: this.currentMetrics.gpt.requests.today,
        tokensUsed: this.currentMetrics.gpt.tokens.today,
        costToday: `$${this.currentMetrics.gpt.cost.today.toFixed(4)}`,
        costTotal: `$${this.currentMetrics.gpt.cost.total.toFixed(2)}`,
        avgResponseTime: `${this.currentMetrics.gpt.responseTime.average.toFixed(0)}ms`,
        cacheHitRate: this.calculateCacheHitRate()
      },
      whatsapp: {
        status: this.currentMetrics.whatsapp.status,
        uptime: this.calculateWhatsAppUptime(),
        lastCheck: this.formatTimestamp(this.currentMetrics.whatsapp.lastCheck)
      },
      errors: {
        today: this.currentMetrics.errors.today,
        total: this.currentMetrics.errors.total,
        recent: this.currentMetrics.errors.recent.slice(0, 5)
      },
      api: {
        requestsToday: this.currentMetrics.api.requests.today,
        avgResponseTime: `${this.currentMetrics.api.responseTime.average.toFixed(0)}ms`,
        successRate: this.calculateAPISuccessRate()
      },
      lastUpdate: this.formatTimestamp(this.currentMetrics.system.lastUpdate)
    };
  }

  // Obtener métricas detalladas
  getDetailedMetrics() {
    return {
      ...this.currentMetrics,
      calculated: {
        messageSuccessRate: this.calculateSuccessRate(),
        gptCacheHitRate: this.calculateCacheHitRate(),
        apiSuccessRate: this.calculateAPISuccessRate(),
        whatsappUptime: this.calculateWhatsAppUptime(),
        hourlyActivity: this.getHourlyActivity()
      }
    };
  }

  // Obtener actividad por hora
  getHourlyActivity() {
    const activity = [];
    for (let hour = 0; hour < 24; hour++) {
      activity.push({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        sent: this.currentMetrics.messages.sent.byHour[hour] || 0,
        received: this.currentMetrics.messages.received.byHour[hour] || 0
      });
    }
    return activity;
  }

  // === MÉTODOS DE CÁLCULO ===

  calculateSuccessRate() {
    const total = this.currentMetrics.messages.sent.total;
    const failed = this.currentMetrics.messages.sent.failed;
    if (total === 0) return 100;
    return ((total - failed) / total * 100).toFixed(1);
  }

  calculateCacheHitRate() {
    const hits = this.currentMetrics.gpt.cache.hits;
    const total = hits + this.currentMetrics.gpt.cache.misses;
    if (total === 0) return 0;
    return (hits / total * 100).toFixed(1);
  }

  calculateAPISuccessRate() {
    const codes = this.currentMetrics.api.statusCodes;
    let success = 0;
    let total = 0;
    
    for (const [code, count] of Object.entries(codes)) {
      total += count;
      if (code.startsWith('2')) success += count;
    }
    
    if (total === 0) return 100;
    return (success / total * 100).toFixed(1);
  }

  calculateWhatsAppUptime() {
    const start = this.currentMetrics.whatsapp.uptime.start;
    const now = Date.now();
    const totalTime = now - start;
    
    let downtime = 0;
    for (const disconnection of this.currentMetrics.whatsapp.uptime.disconnections) {
      downtime += disconnection.duration || (now - disconnection.timestamp);
    }
    
    const uptime = ((totalTime - downtime) / totalTime * 100).toFixed(2);
    return `${uptime}%`;
  }

  // === MÉTODOS DE UTILIDAD ===

  updateTimestamp() {
    this.currentMetrics.system.lastUpdate = Date.now();
  }

  formatTimestamp(timestamp) {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString('es-PE');
  }

  // Guardar métricas a archivo
  async saveMetrics() {
    try {
      const dir = path.dirname(this.metricsFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(
        this.metricsFile,
        JSON.stringify(this.currentMetrics, null, 2)
      );
      
      logger.info('Metrics saved successfully');
    } catch (error) {
      logger.error('Error saving metrics:', error.message);
    }
  }

  // Rotar métricas diarias
  rotateMetrics() {
    // Guardar archivo histórico
    const date = new Date().toISOString().split('T')[0];
    const historicalFile = path.join(
      __dirname,
      '../data/metrics-history',
      `metrics-${date}.json`
    );
    
    try {
      const dir = path.dirname(historicalFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(
        historicalFile,
        JSON.stringify(this.currentMetrics, null, 2)
      );
      
      // Resetear contadores diarios
      this.currentMetrics.messages.sent.today = 0;
      this.currentMetrics.messages.sent.byHour = {};
      this.currentMetrics.messages.received.today = 0;
      this.currentMetrics.messages.received.byHour = {};
      this.currentMetrics.gpt.requests.today = 0;
      this.currentMetrics.gpt.tokens.today = 0;
      this.currentMetrics.gpt.cost.today = 0;
      this.currentMetrics.errors.today = 0;
      this.currentMetrics.api.requests.today = 0;
      
      logger.info('Metrics rotated successfully');
    } catch (error) {
      logger.error('Error rotating metrics:', error.message);
    }
  }

  // Obtener histórico de métricas
  async getHistoricalMetrics(days = 7) {
    const historical = [];
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const file = path.join(
        __dirname,
        '../data/metrics-history',
        `metrics-${dateStr}.json`
      );
      
      if (fs.existsSync(file)) {
        try {
          const data = fs.readFileSync(file, 'utf8');
          historical.push({
            date: dateStr,
            metrics: JSON.parse(data)
          });
        } catch (error) {
          logger.error(`Error reading historical metrics for ${dateStr}:`, error.message);
        }
      }
    }
    
    return historical;
  }
}

module.exports = new MetricsService();