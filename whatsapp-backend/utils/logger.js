const fs = require('fs');
const path = require('path');

// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

class Logger {
  constructor() {
    this.logFile = path.join(logsDir, `app-${new Date().toISOString().split('T')[0]}.log`);
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(data && { data })
    };
    return JSON.stringify(logEntry);
  }

  writeToFile(logEntry) {
    fs.appendFileSync(this.logFile, logEntry + '\n');
  }

  log(level, message, data = null) {
    const logEntry = this.formatMessage(level, message, data);
    
    // Escribir a archivo
    this.writeToFile(logEntry);
    
    // Imprimir en consola con colores
    const colors = {
      INFO: '\x1b[36m',  // Cyan
      WARN: '\x1b[33m',  // Yellow
      ERROR: '\x1b[31m', // Red
      SUCCESS: '\x1b[32m' // Green
    };
    
    const resetColor = '\x1b[0m';
    const color = colors[level] || '';
    
    console.log(`${color}[${level}] ${new Date().toLocaleTimeString()} - ${message}${resetColor}`);
    
    if (data) {
      console.log(data);
    }
  }

  info(message, data) {
    this.log('INFO', message, data);
  }

  warn(message, data) {
    this.log('WARN', message, data);
  }

  error(message, data) {
    this.log('ERROR', message, data);
  }

  success(message, data) {
    this.log('SUCCESS', message, data);
  }
}

module.exports = new Logger();