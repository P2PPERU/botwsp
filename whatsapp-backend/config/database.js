const fs = require('fs');
const path = require('path');

// Configuración de base de datos
const DATABASE_CONFIG = {
  // Configuración actual (JSON Files)
  current: {
    type: 'json',
    dataPath: path.join(__dirname, '../data'),
    backupPath: path.join(__dirname, '../backups'),
    maxFileSize: 10 * 1024 * 1024, // 10MB máximo por archivo
    backupInterval: 24 * 60 * 60 * 1000, // Backup cada 24 horas
    autoCleanup: true,
    cleanupDays: 30 // Limpiar archivos más antiguos de 30 días
  },
  
  // Configuraciones para migración futura
  mongodb: {
    host: process.env.MONGODB_HOST || 'localhost',
    port: process.env.MONGODB_PORT || 27017,
    database: process.env.MONGODB_DATABASE || 'whatsapp_hub',
    username: process.env.MONGODB_USERNAME,
    password: process.env.MONGODB_PASSWORD,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },
  
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    database: process.env.MYSQL_DATABASE || 'whatsapp_hub',
    username: process.env.MYSQL_USERNAME || 'root',
    password: process.env.MYSQL_PASSWORD,
    options: {
      dialect: 'mysql',
      logging: process.env.NODE_ENV === 'development',
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  },
  
  postgresql: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    database: process.env.POSTGRES_DATABASE || 'whatsapp_hub',
    username: process.env.POSTGRES_USERNAME || 'postgres',
    password: process.env.POSTGRES_PASSWORD,
    options: {
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development',
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  }
};

// Rutas de archivos JSON
const JSON_FILES = {
  clients: path.join(DATABASE_CONFIG.current.dataPath, 'clients.json'),
  messages: path.join(DATABASE_CONFIG.current.dataPath, 'messages.json'),
  sessions: path.join(DATABASE_CONFIG.current.dataPath, 'sessions.json'),
  logs: path.join(DATABASE_CONFIG.current.dataPath, 'logs.json'),
  settings: path.join(DATABASE_CONFIG.current.dataPath, 'settings.json')
};

// Inicializar estructura de directorios
function initializeDirectories() {
  const directories = [
    DATABASE_CONFIG.current.dataPath,
    DATABASE_CONFIG.current.backupPath,
    path.join(__dirname, '../logs')
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
}

// Verificar y crear archivos JSON base si no existen
function initializeJSONFiles() {
  const defaultData = {
    clients: [],
    messages: [],
    sessions: [],
    logs: [],
    settings: {
      initialized: true,
      version: '1.0.0',
      createdAt: new Date().toISOString()
    }
  };

  Object.entries(JSON_FILES).forEach(([key, filePath]) => {
    if (!fs.existsSync(filePath)) {
      try {
        fs.writeFileSync(filePath, JSON.stringify(defaultData[key], null, 2));
        console.log(`📄 Created JSON file: ${path.basename(filePath)}`);
      } catch (error) {
        console.error(`❌ Error creating ${filePath}:`, error.message);
      }
    }
  });
}

// Función para hacer backup de archivos JSON
async function backupJSONFiles() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(DATABASE_CONFIG.current.backupPath, timestamp);
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupPromises = Object.entries(JSON_FILES).map(([key, filePath]) => {
      return new Promise((resolve, reject) => {
        if (fs.existsSync(filePath)) {
          const backupPath = path.join(backupDir, path.basename(filePath));
          fs.copyFile(filePath, backupPath, (err) => {
            if (err) reject(err);
            else resolve({ file: key, backed_up: true });
          });
        } else {
          resolve({ file: key, backed_up: false, reason: 'File not found' });
        }
      });
    });

    const results = await Promise.all(backupPromises);
    
    console.log(`💾 Backup completed: ${backupDir}`);
    return {
      success: true,
      backupPath: backupDir,
      files: results,
      timestamp: timestamp
    };

  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Función para limpiar backups antiguos
function cleanupOldBackups() {
  try {
    const backupPath = DATABASE_CONFIG.current.backupPath;
    const cleanupDate = new Date();
    cleanupDate.setDate(cleanupDate.getDate() - DATABASE_CONFIG.current.cleanupDays);

    if (!fs.existsSync(backupPath)) {
      return { cleaned: 0, message: 'Backup directory not found' };
    }

    const backupDirs = fs.readdirSync(backupPath);
    let cleanedCount = 0;

    backupDirs.forEach(dirName => {
      const dirPath = path.join(backupPath, dirName);
      const stat = fs.statSync(dirPath);
      
      if (stat.isDirectory() && stat.mtime < cleanupDate) {
        fs.rmSync(dirPath, { recursive: true, force: true });
        cleanedCount++;
        console.log(`🗑️  Removed old backup: ${dirName}`);
      }
    });

    return {
      cleaned: cleanedCount,
      message: `Cleaned ${cleanedCount} old backups`
    };

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    return {
      cleaned: 0,
      error: error.message
    };
  }
}

// Función para verificar salud de la base de datos
function checkDatabaseHealth() {
  const health = {
    status: 'healthy',
    type: DATABASE_CONFIG.current.type,
    issues: [],
    stats: {}
  };

  try {
    // Verificar directorios
    if (!fs.existsSync(DATABASE_CONFIG.current.dataPath)) {
      health.issues.push('Data directory not found');
      health.status = 'unhealthy';
    }

    // Verificar archivos JSON
    Object.entries(JSON_FILES).forEach(([key, filePath]) => {
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        health.stats[key] = {
          exists: true,
          size: stat.size,
          modified: stat.mtime,
          readable: fs.constants.R_OK,
          writable: fs.constants.W_OK
        };

        // Verificar si el archivo es muy grande
        if (stat.size > DATABASE_CONFIG.current.maxFileSize) {
          health.issues.push(`${key}.json is too large (${stat.size} bytes)`);
        }

        // Intentar leer el archivo
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          JSON.parse(content);
        } catch (parseError) {
          health.issues.push(`${key}.json is corrupted: ${parseError.message}`);
          health.status = 'unhealthy';
        }
      } else {
        health.stats[key] = { exists: false };
        health.issues.push(`${key}.json not found`);
      }
    });

    // Verificar espacio en disco
    const dataPath = DATABASE_CONFIG.current.dataPath;
    const diskUsage = getDiskUsage(dataPath);
    health.stats.diskUsage = diskUsage;

    if (diskUsage.free < 100 * 1024 * 1024) { // Menos de 100MB libres
      health.issues.push('Low disk space');
      health.status = 'warning';
    }

  } catch (error) {
    health.status = 'unhealthy';
    health.issues.push(`Health check error: ${error.message}`);
  }

  return health;
}

// Función para obtener uso de disco (simplificada)
function getDiskUsage(dirPath) {
  try {
    const stats = fs.statSync(dirPath);
    // En un sistema real, usarías bibliotecas como 'statvfs' para obtener stats reales
    return {
      total: 1000 * 1024 * 1024, // 1GB simulado
      used: 100 * 1024 * 1024,   // 100MB simulado
      free: 900 * 1024 * 1024    // 900MB simulado
    };
  } catch (error) {
    return {
      total: 0,
      used: 0,
      free: 0,
      error: error.message
    };
  }
}

// Función para optimizar archivos JSON (compactar, limpiar)
function optimizeJSONFiles() {
  const results = [];
  
  Object.entries(JSON_FILES).forEach(([key, filePath]) => {
    try {
      if (fs.existsSync(filePath)) {
        const originalSize = fs.statSync(filePath).size;
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        
        // Reescribir el archivo compactado
        const optimizedContent = JSON.stringify(data, null, 2);
        fs.writeFileSync(filePath, optimizedContent);
        
        const newSize = fs.statSync(filePath).size;
        
        results.push({
          file: key,
          originalSize: originalSize,
          newSize: newSize,
          saved: originalSize - newSize,
          optimized: true
        });
      }
    } catch (error) {
      results.push({
        file: key,
        optimized: false,
        error: error.message
      });
    }
  });
  
  return results;
}

// Función para migrar a otra base de datos (preparación futura)
function prepareMigration(targetType = 'mongodb') {
  const migrationPlan = {
    source: 'json',
    target: targetType,
    steps: [],
    estimatedTime: 0,
    dataSize: 0
  };

  // Calcular tamaño de datos
  Object.entries(JSON_FILES).forEach(([key, filePath]) => {
    if (fs.existsSync(filePath)) {
      const size = fs.statSync(filePath).size;
      migrationPlan.dataSize += size;
      migrationPlan.steps.push({
        step: `Migrate ${key}`,
        file: filePath,
        size: size,
        estimated_time: Math.ceil(size / 1000000) // 1 segundo por MB aproximadamente
      });
    }
  });

  migrationPlan.estimatedTime = migrationPlan.steps.reduce((total, step) => total + step.estimated_time, 0);

  return migrationPlan;
}

// Inicialización automática
initializeDirectories();
initializeJSONFiles();

// Programar backup automático si está habilitado
if (DATABASE_CONFIG.current.backupInterval > 0) {
  setInterval(() => {
    backupJSONFiles().then(result => {
      if (result.success) {
        console.log('🔄 Automatic backup completed');
      }
    });
  }, DATABASE_CONFIG.current.backupInterval);
}

// Programar limpieza automática
if (DATABASE_CONFIG.current.autoCleanup) {
  setInterval(() => {
    cleanupOldBackups();
  }, 24 * 60 * 60 * 1000); // Cada 24 horas
}

module.exports = {
  DATABASE_CONFIG,
  JSON_FILES,
  
  // Funciones de inicialización
  initializeDirectories,
  initializeJSONFiles,
  
  // Funciones de mantenimiento
  backupJSONFiles,
  cleanupOldBackups,
  optimizeJSONFiles,
  
  // Funciones de monitoreo
  checkDatabaseHealth,
  getDiskUsage,
  
  // Funciones de migración
  prepareMigration,
  
  // Utilidades
  getCurrentConfig: () => DATABASE_CONFIG.current,
  getConnectionString: (type) => {
    const config = DATABASE_CONFIG[type];
    if (!config) return null;
    
    switch (type) {
      case 'mongodb':
        return `mongodb://${config.username ? config.username + ':' + config.password + '@' : ''}${config.host}:${config.port}/${config.database}`;
      case 'mysql':
      case 'postgresql':
        return `${type}://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;
      default:
        return null;
    }
  }
};