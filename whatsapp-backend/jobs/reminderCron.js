const cron = require('node-cron');
const reminderService = require('../services/reminderService');
const logger = require('../utils/logger');

// Verificación de recordatorios diaria a las 9:00 AM
cron.schedule('0 9 * * *', async () => {
  logger.info('⏰ Iniciando verificación programada de recordatorios...');
  
  try {
    await reminderService.checkAndSendReminders();
    logger.success('✅ Verificación de recordatorios completada');
  } catch (error) {
    logger.error('❌ Error en verificación programada:', error.message);
  }
});

// Verificación de salud del sistema cada hora
cron.schedule('0 * * * *', async () => {
  logger.info('🔍 Verificación de salud del sistema...');
  
  try {
    // Aquí podrías añadir verificaciones de salud
    // Como comprobar conexión con WPPConnect, n8n, etc.
    logger.info('💚 Sistema funcionando correctamente');
  } catch (error) {
    logger.error('❤️‍🩹 Problema detectado en el sistema:', error.message);
  }
});

// Limpieza de logs antiguos cada domingo a las 2:00 AM
cron.schedule('0 2 * * 0', () => {
  logger.info('🧹 Iniciando limpieza de logs antiguos...');
  // Implementar limpieza de logs aquí
});

logger.info('📅 Trabajos programados inicializados:');
logger.info('   - Recordatorios: Diario a las 9:00 AM');
logger.info('   - Salud del sistema: Cada hora');
logger.info('   - Limpieza de logs: Domingos a las 2:00 AM');