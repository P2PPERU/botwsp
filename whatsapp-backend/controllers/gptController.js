const gptService = require('../services/gptService');
const logger = require('../utils/logger');

class GPTController {
  
  // Generar respuesta automática
  async generateResponse(req, res) {
    try {
      const { message, clientContext } = req.body;
      
      if (!message || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Message is required'
        });
      }

      const response = await gptService.generateResponse(message, clientContext);
      
      res.json({
        success: true,
        data: {
          originalMessage: message,
          response: response,
          hasContext: !!clientContext,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Error in generateResponse:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to generate response',
        details: error.message
      });
    }
  }

  // Generar respuesta específica por tipo
  async generateSpecificResponse(req, res) {
    try {
      const { type, data } = req.body;
      
      if (!type || !data) {
        return res.status(400).json({
          success: false,
          error: 'Type and data are required'
        });
      }

      const validTypes = ['pricing_inquiry', 'technical_support', 'renewal_assistance', 'general_inquiry'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          error: `Invalid type. Must be one of: ${validTypes.join(', ')}`
        });
      }

      const response = await gptService.generateSpecificResponse(type, data);
      
      res.json({
        success: true,
        data: {
          type: type,
          response: response,
          inputData: data,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Error in generateSpecificResponse:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to generate specific response',
        details: error.message
      });
    }
  }

  // Analizar intención del mensaje
  async analyzeIntent(req, res) {
    try {
      const { message } = req.body;
      
      if (!message || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Message is required'
        });
      }

      const intent = await gptService.analyzeIntent(message);
      
      res.json({
        success: true,
        data: {
          message: message,
          intent: intent,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Error in analyzeIntent:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze intent',
        details: error.message
      });
    }
  }

  // Mejorar mensaje existente
  async enhanceMessage(req, res) {
    try {
      const { message, improvements = [] } = req.body;
      
      if (!message || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Message is required'
        });
      }

      const enhanced = await gptService.enhanceMessage(message, improvements);
      
      res.json({
        success: true,
        data: {
          originalMessage: message,
          enhancedMessage: enhanced,
          improvements: improvements,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Error in enhanceMessage:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to enhance message',
        details: error.message
      });
    }
  }

  // Generar resumen de conversación
  async generateSummary(req, res) {
    try {
      const { messages } = req.body;
      
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Messages array is required and cannot be empty'
        });
      }

      const summary = await gptService.generateConversationSummary(messages);
      
      res.json({
        success: true,
        data: {
          summary: summary,
          messageCount: messages.length,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Error in generateSummary:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to generate conversation summary',
        details: error.message
      });
    }
  }

  // Obtener configuración y estadísticas de GPT
  async getConfig(req, res) {
    try {
      const stats = gptService.getStats();
      
      res.json({
        success: true,
        data: {
          ...stats,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Error getting GPT config:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get GPT configuration',
        details: error.message
      });
    }
  }

  // Procesar múltiples mensajes para respuestas automáticas
  async processMultipleMessages(req, res) {
    try {
      const { messages } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({
          success: false,
          error: 'Messages array is required'
        });
      }

      const results = [];
      
      for (const msgData of messages) {
        try {
          const { message, clientContext, phone } = msgData;
          
          if (message && message.trim().length > 0) {
            // Analizar intención
            const intent = await gptService.analyzeIntent(message);
            
            // Generar respuesta
            const response = await gptService.generateResponse(message, clientContext);
            
            results.push({
              phone: phone,
              originalMessage: message,
              intent: intent,
              response: response,
              status: 'success'
            });
          } else {
            results.push({
              phone: phone,
              status: 'error',
              error: 'Empty message'
            });
          }
          
          // Pequeño delay entre procesamiento
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          results.push({
            phone: msgData.phone,
            status: 'error',
            error: error.message
          });
        }
      }

      const successCount = results.filter(r => r.status === 'success').length;
      
      res.json({
        success: true,
        data: {
          results: results,
          summary: {
            total: messages.length,
            successful: successCount,
            failed: messages.length - successCount
          },
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Error processing multiple messages:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to process multiple messages',
        details: error.message
      });
    }
  }

  // Generar respuestas sugeridas para un mensaje
  async generateSuggestions(req, res) {
    try {
      const { message, clientContext, count = 3 } = req.body;
      
      if (!message || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Message is required'
        });
      }

      const suggestions = [];
      
      // Generar múltiples variaciones
      for (let i = 0; i < Math.min(count, 5); i++) {
        try {
          const response = await gptService.generateResponse(message, clientContext);
          if (response && !suggestions.includes(response)) {
            suggestions.push(response);
          }
          
          // Pequeño delay entre generaciones
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          logger.warn(`Failed to generate suggestion ${i + 1}:`, error.message);
        }
      }

      res.json({
        success: true,
        data: {
          originalMessage: message,
          suggestions: suggestions,
          count: suggestions.length,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Error generating suggestions:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to generate suggestions',
        details: error.message
      });
    }
  }

  // Health check para GPT service
  async healthCheck(req, res) {
    try {
      const isConfigured = gptService.isConfigured();
      
      if (!isConfigured) {
        return res.status(503).json({
          success: false,
          error: 'GPT service not configured',
          details: 'OpenAI API key not provided'
        });
      }

      // Test básico de funcionalidad
      const testResponse = await gptService.generateResponse('Hola, ¿cómo estás?');
      
      res.json({
        success: true,
        data: {
          status: 'healthy',
          configured: isConfigured,
          testResponse: testResponse ? 'OK' : 'Failed',
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('GPT health check failed:', error.message);
      res.status(503).json({
        success: false,
        error: 'GPT service unhealthy',
        details: error.message
      });
    }
  }

  // Obtener estadísticas de uso de GPT
  async getUsageStats(req, res) {
    try {
      // En un sistema real, aquí consultarías métricas de uso
      const stats = {
        totalRequests: Math.floor(Math.random() * 1000) + 500, // Mock data
        successfulRequests: Math.floor(Math.random() * 800) + 400,
        averageResponseTime: Math.floor(Math.random() * 2000) + 500,
        cacheHitRate: (Math.random() * 0.3 + 0.6).toFixed(2), // 60-90%
        topIntents: [
          { intent: 'pricing', count: 156 },
          { intent: 'technical', count: 89 },
          { intent: 'renewal', count: 67 },
          { intent: 'general', count: 45 }
        ],
        dailyUsage: this.generateMockDailyUsage()
      };

      res.json({
        success: true,
        data: {
          ...stats,
          period: '30 days',
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Error getting GPT usage stats:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get usage statistics',
        details: error.message
      });
    }
  }

  // Método auxiliar para generar datos mock de uso diario
  generateMockDailyUsage() {
    const daily = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      daily.push({
        date: date.toISOString().split('T')[0],
        requests: Math.floor(Math.random() * 50) + 10,
        responses: Math.floor(Math.random() * 45) + 8
      });
    }
    
    return daily;
  }
}

module.exports = new GPTController();