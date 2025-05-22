const { Configuration, OpenAIApi } = require('openai');

// Configuración de OpenAI
const OPENAI_CONFIG = {
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
  temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
  maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 500,
  presencePenalty: parseFloat(process.env.OPENAI_PRESENCE_PENALTY) || 0.6,
  frequencyPenalty: parseFloat(process.env.OPENAI_FREQUENCY_PENALTY) || 0.5,
  topP: parseFloat(process.env.OPENAI_TOP_P) || 1,
  timeout: parseInt(process.env.OPENAI_TIMEOUT) || 30000, // 30 segundos
};

// Modelos disponibles y sus características
const AVAILABLE_MODELS = {
  'gpt-4': {
    name: 'GPT-4',
    contextWindow: 8192,
    costPer1kTokens: 0.03,
    description: 'Modelo más avanzado, mejor para tareas complejas'
  },
  'gpt-4-turbo': {
    name: 'GPT-4 Turbo',
    contextWindow: 128000,
    costPer1kTokens: 0.01,
    description: 'Modelo optimizado con ventana de contexto más grande'
  },
  'gpt-3.5-turbo': {
    name: 'GPT-3.5 Turbo',
    contextWindow: 4096,
    costPer1kTokens: 0.002,
    description: 'Modelo rápido y económico para la mayoría de tareas'
  },
  'gpt-3.5-turbo-16k': {
    name: 'GPT-3.5 Turbo 16K',
    contextWindow: 16384,
    costPer1kTokens: 0.004,
    description: 'Versión con mayor ventana de contexto'
  }
};

// Configuraciones predefinidas por tipo de uso
const PRESET_CONFIGS = {
  // Para respuestas rápidas y directas
  quick_response: {
    temperature: 0.3,
    maxTokens: 200,
    presencePenalty: 0.2,
    frequencyPenalty: 0.2
  },
  
  // Para respuestas creativas y variadas
  creative_response: {
    temperature: 0.8,
    maxTokens: 600,
    presencePenalty: 0.8,
    frequencyPenalty: 0.6
  },
  
  // Para análisis y clasificación
  analytical: {
    temperature: 0.1,
    maxTokens: 100,
    presencePenalty: 0,
    frequencyPenalty: 0
  },
  
  // Para conversaciones largas
  conversational: {
    temperature: 0.7,
    maxTokens: 500,
    presencePenalty: 0.6,
    frequencyPenalty: 0.5
  }
};

// Crear cliente de OpenAI
let openaiClient = null;

if (OPENAI_CONFIG.apiKey) {
  const configuration = new Configuration({
    apiKey: OPENAI_CONFIG.apiKey,
  });
  
  openaiClient = new OpenAIApi(configuration);
  console.log('✅ OpenAI client configured successfully');
} else {
  console.warn('⚠️  OpenAI API key not found - GPT features will be disabled');
}

// Función para validar configuración
function validateConfig() {
  const errors = [];
  
  if (!OPENAI_CONFIG.apiKey) {
    errors.push('OPENAI_API_KEY is required');
  }
  
  if (!AVAILABLE_MODELS[OPENAI_CONFIG.model]) {
    errors.push(`Invalid model: ${OPENAI_CONFIG.model}`);
  }
  
  if (OPENAI_CONFIG.temperature < 0 || OPENAI_CONFIG.temperature > 2) {
    errors.push('Temperature must be between 0 and 2');
  }
  
  if (OPENAI_CONFIG.maxTokens < 1 || OPENAI_CONFIG.maxTokens > 4000) {
    errors.push('Max tokens must be between 1 and 4000');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

// Función para obtener configuración según el tipo de uso
function getConfigForType(type = 'conversational') {
  const baseConfig = { ...OPENAI_CONFIG };
  const presetConfig = PRESET_CONFIGS[type] || PRESET_CONFIGS.conversational;
  
  return {
    ...baseConfig,
    ...presetConfig
  };
}

// Función para calcular costo estimado
function calculateEstimatedCost(tokens, model = OPENAI_CONFIG.model) {
  const modelInfo = AVAILABLE_MODELS[model];
  if (!modelInfo) return 0;
  
  return (tokens / 1000) * modelInfo.costPer1kTokens;
}

// Función para verificar límites de rate limiting
function checkRateLimits(requestsPerMinute = 60) {
  // Implementación básica - en producción usarías Redis o similar
  const now = Date.now();
  const windowStart = now - 60000; // 1 minuto
  
  // Aquí implementarías la lógica de rate limiting
  return {
    allowed: true,
    remainingRequests: requestsPerMinute - 1,
    resetTime: windowStart + 60000
  };
}

// Función para monitorear uso
function trackUsage(tokens, model, type = 'completion') {
  const usage = {
    timestamp: new Date().toISOString(),
    tokens: tokens,
    model: model,
    type: type,
    cost: calculateEstimatedCost(tokens, model)
  };
  
  // En producción, guardarías esto en base de datos
  console.log('OpenAI Usage:', usage);
  
  return usage;
}

// Función para obtener información del modelo actual
function getCurrentModelInfo() {
  return AVAILABLE_MODELS[OPENAI_CONFIG.model] || null;
}

module.exports = {
  // Configuraciones
  OPENAI_CONFIG,
  AVAILABLE_MODELS,
  PRESET_CONFIGS,
  
  // Cliente
  openaiClient,
  
  // Funciones utilitarias
  validateConfig,
  getConfigForType,
  calculateEstimatedCost,
  checkRateLimits,
  trackUsage,
  getCurrentModelInfo,
  
  // Estados
  isConfigured: () => !!OPENAI_CONFIG.apiKey,
  getStats: () => ({
    configured: !!OPENAI_CONFIG.apiKey,
    model: OPENAI_CONFIG.model,
    maxTokens: OPENAI_CONFIG.maxTokens,
    temperature: OPENAI_CONFIG.temperature,
    modelInfo: getCurrentModelInfo()
  })
};