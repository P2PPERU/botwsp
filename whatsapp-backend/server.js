const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar rutas
const sessionRoutes = require('./routes/sessions');
const messageRoutes = require('./routes/messages');
const clientRoutes = require('./routes/clients');
const workflowRoutes = require('./routes/workflows');
const webhookRoutes = require('./routes/webhooks');

// Importar middleware
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Importar trabajos programados
require('./jobs/reminderCron');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware global
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging de requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Rutas principales
app.use('/api/sessions', sessionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/webhook', webhookRoutes);

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Ruta de estadísticas generales
app.get('/api/stats', require('./controllers/statsController').getStats);

// Manejo de errores
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  logger.info(`🚀 Backend API running on port ${PORT}`);
  logger.info(`📱 WPPConnect URL: ${process.env.WPPCONNECT_URL}`);
  logger.info(`🤖 n8n URL: ${process.env.N8N_URL}`);
  logger.info(`🧠 OpenAI: ${process.env.OPENAI_API_KEY ? 'Configured' : 'Not configured'}`);
  logger.info('⏰ Cron jobs initialized');
});

module.exports = app;