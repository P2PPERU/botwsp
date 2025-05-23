// server.js - Backend con Sistema de Autenticación y Métricas Avanzadas
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// =========================
// IMPORTAR MIDDLEWARES Y SERVICIOS
// =========================
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const { verifyToken, checkRole, checkPermission, userRateLimit, auditLog } = require('./middleware/auth');
const { trackAPIRequests, updateClientStats } = require('./middleware/metrics'); // <- NUEVOS

// Importar trabajos programados (cron jobs)
require('./jobs/reminderCron');

const app = express();
const PORT = process.env.PORT || 3001;

// =========================
// MIDDLEWARE GLOBAL
// =========================
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static('public'));

// Logging de requests
app.use((req, res, next) => {
  req.startTime = Date.now();
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// =========================
// MIDDLEWARE DE MÉTRICAS (NUEVO)
// =========================
// Rastrear todas las requests de API
app.use('/api', trackAPIRequests);

// Actualizar estadísticas de clientes
app.use('/api/clients', updateClientStats);

// =========================
// RUTAS PÚBLICAS (SIN AUTENTICACIÓN)
// =========================
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '2.0.0',
    whatsapp: 'whatsapp-web.js'
  });
});

// Rutas de autenticación (login, registro, etc)
app.use('/api/auth', require('./routes/auth'));

// Webhooks (público pero con token seguro)
app.use('/webhook', (req, res, next) => {
  const webhookToken = req.headers['x-webhook-token'];
  if (webhookToken !== process.env.WEBHOOK_AUTH_TOKEN) {
    return res.status(401).json({
      success: false,
      error: 'Invalid webhook token'
    });
  }
  next();
}, require('./routes/webhooks'));

// =========================
// RUTAS DE MÉTRICAS (PÚBLICA CON JWT)
// =========================
app.use('/api/metrics', require('./routes/metrics'));
app.get('/metrics', verifyToken, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'metrics-dashboard.html'));
});

// =========================
// MIDDLEWARE DE AUTENTICACIÓN (RESTO DE /api)
// =========================
app.use('/api', verifyToken);
app.use('/api', userRateLimit(100, 15 * 60 * 1000)); // 100 requests por 15min
app.use('/api', auditLog);

// =========================
// RUTAS PROTEGIDAS
// =========================

// Usuarios - gestión completa
app.use('/api/users', require('./routes/users'));

// Sesiones - solo autenticados
app.use('/api/sessions', require('./routes/sessions'));

// Mensajes - permisos finos por tipo
app.use('/api/messages', (req, res, next) => {
  if (req.method === 'POST' && !req.user.permissions?.messages?.includes('send')) {
    return res.status(403).json({ success: false, error: 'You do not have permission to send messages' });
  }
  if (req.method === 'DELETE' && !req.user.permissions?.messages?.includes('delete')) {
    return res.status(403).json({ success: false, error: 'You do not have permission to delete messages' });
  }
  next();
}, require('./routes/messages'));

// Clientes - permisos según método HTTP
app.use('/api/clients', (req, res, next) => {
  const method = req.method;
  const permissions = req.user.permissions?.clients || [];
  if (method === 'GET' && !permissions.includes('view')) {
    return res.status(403).json({ success: false, error: 'You do not have permission to view clients' });
  }
  if (method === 'POST' && !permissions.includes('create')) {
    return res.status(403).json({ success: false, error: 'You do not have permission to create clients' });
  }
  if (method === 'PUT' && !permissions.includes('edit')) {
    return res.status(403).json({ success: false, error: 'You do not have permission to edit clients' });
  }
  if (method === 'DELETE' && !permissions.includes('delete')) {
    return res.status(403).json({ success: false, error: 'You do not have permission to delete clients' });
  }
  next();
}, require('./routes/clients'));

// Workflows
app.use('/api/workflows', checkPermission('workflows', 'view'), require('./routes/workflows'));

// GPT Controllers
const gptController = require('./controllers/gptController');
app.post('/api/gpt/generate', checkPermission('messages', 'send'), gptController.generateResponse);
app.post('/api/gpt/analyze-intent', checkPermission('messages', 'view'), gptController.analyzeIntent);
app.get('/api/gpt/config', checkRole(['admin']), gptController.getConfig);

// Stats Controllers
const statsController = require('./controllers/statsController');
app.get('/api/stats', checkPermission('stats', 'view'), statsController.getStats);
app.get('/api/stats/system', checkRole(['admin']), statsController.getSystemStats);
app.get('/api/stats/clients', checkPermission('stats', 'view'), statsController.getClientStats);
app.get('/api/stats/messages', checkPermission('stats', 'view'), statsController.getMessageStats);
app.get('/api/stats/daily-report', checkPermission('stats', 'view'), statsController.getDailyReport);

// =========================
// PÁGINAS ADMIN Y DASHBOARD
// =========================
app.get('/admin*', verifyToken, checkRole(['admin']), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});
app.get('/dashboard*', verifyToken, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Home redirige a login
app.get('/', (req, res) => {
  res.redirect('/login');
});

// =========================
// ERRORES Y 404
// =========================
app.use(errorHandler);
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// =========================
// INICIALIZACIÓN DEL SISTEMA
// =========================
async function initializeApp() {
  try {
    // Crear usuario admin por defecto si no existe
    const User = require('./models/User');
    const adminExists = await User.findByEmail('admin@whatsapphub.com');
    if (!adminExists) {
      const defaultAdmin = new User({
        email: 'admin@whatsapphub.com',
        password: await User.hashPassword('Admin123!'), // CAMBIAR EN PRODUCCIÓN
        name: 'Administrador',
        role: 'admin',
        status: 'active'
      });
      await defaultAdmin.save();
      logger.success('Default admin user created');
      logger.warn('⚠️  IMPORTANT: Change the default admin password immediately!');
    }

    // Inicializar métricas
    const metricsService = require('./services/metricsService');
    logger.info('📊 Metrics service initialized');

    // Inicializar health check de WhatsApp
    const whatsappService = require('./services/whatsappWebService');
    whatsappService.startHealthCheck();
    logger.info('🔍 WhatsApp health check started');

    // Actualizar estadísticas de clientes al inicio
    const Client = require('./models/Client');
    const clients = await Client.findAll();
    const clientStats = {
      total: clients.length,
      active: clients.filter(c => c.status === 'active').length,
      expiring: clients.filter(c => c.status === 'expiring').length,
      expired: clients.filter(c => c.status === 'expired').length,
      byService: {}
    };
    clients.forEach(client => {
      const service = client.service || 'Unknown';
      clientStats.byService[service] = (clientStats.byService[service] || 0) + 1;
    });
    metricsService.updateClientStats(clientStats);

    // Logs de inicio
    app.listen(PORT, () => {
      logger.info(`🚀 Backend API running on port ${PORT}`);
      logger.info(`📱 WhatsApp: Using whatsapp-web.js`);
      logger.info(`🔒 Authentication: JWT enabled`);
      logger.info(`🤖 n8n URL: ${process.env.N8N_URL || 'Not configured'}`);
      logger.info(`🧠 OpenAI: ${process.env.OPENAI_API_KEY ? 'Configured' : 'Not configured'}`);
      logger.info('⏰ Cron jobs initialized');
      logger.info('🔐 Login at: http://localhost:' + PORT + '/login');
      logger.info('📊 Metrics dashboard: http://localhost:' + PORT + '/metrics');
    });
  } catch (error) {
    logger.error('Failed to initialize app:', error);
    process.exit(1);
  }
}

// Iniciar aplicación
initializeApp();

module.exports = app;
