const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar middleware
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Importar trabajos programados
require('./jobs/reminderCron');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware global mejorado
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging de requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Importar controladores
const sessionController = require('./controllers/sessionController');
const messageController = require('./controllers/messageController');
const clientController = require('./controllers/clientController');
const statsController = require('./controllers/statsController');
const workflowController = require('./controllers/workflowController');

// Rutas principales con binding correcto
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/workflows', require('./routes/workflows'));
app.use('/webhook', require('./routes/webhooks'));

// Ruta de estadísticas con binding correcto
app.get('/api/stats', (req, res) => statsController.getStats(req, res));

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0'
  });
});

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