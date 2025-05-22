const OpenAI = require('openai');
const logger = require('../utils/logger');
const messageTemplates = require('../utils/messageTemplates');

class GPTService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    this.temperature = parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7;
    this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS) || 500;
    
    if (this.apiKey) {
      this.openai = new OpenAI({
        apiKey: this.apiKey,
      });
      console.log('✅ OpenAI configured successfully');
    } else {
      console.warn('⚠️ OpenAI API key not configured - GPT features disabled');
    }

    // Prompt del sistema
    this.systemPrompt = this.getSystemPrompt();
    
    // Cache de respuestas para evitar repetición
    this.responseCache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutos
  }

  // Generar respuesta automática
  async generateResponse(userMessage, clientContext = null) {
    try {
      if (!this.openai) {
        return this.getFallbackResponse(userMessage);
      }

      // Verificar cache
      const cacheKey = this.generateCacheKey(userMessage, clientContext);
      const cachedResponse = this.responseCache.get(cacheKey);
      
      if (cachedResponse && Date.now() - cachedResponse.timestamp < this.cacheTimeout) {
        logger.info('Using cached GPT response');
        return cachedResponse.response;
      }

      // Preparar contexto personalizado
      const contextualPrompt = this.buildContextualPrompt(userMessage, clientContext);
      
      // Llamada a OpenAI v4
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: contextualPrompt }
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        presence_penalty: 0.6,
        frequency_penalty: 0.5
      });

      const response = completion.choices[0]?.message?.content?.trim();
      
      if (response) {
        // Guardar en cache
        this.responseCache.set(cacheKey, {
          response: response,
          timestamp: Date.now()
        });

        // Limpiar cache viejo
        this.cleanCache();

        logger.success('GPT response generated successfully');
        return response;
      } else {
        throw new Error('Empty response from OpenAI');
      }

    } catch (error) {
      logger.error('Error generating GPT response:', error.message);
      
      // Respuesta de fallback
      return this.getFallbackResponse(userMessage, clientContext);
    }
  }

  // Generar respuesta para consulta específica
  async generateSpecificResponse(type, data) {
    try {
      if (!this.openai) {
        return this.getSpecificFallback(type, data);
      }

      let prompt = '';
      
      switch (type) {
        case 'pricing_inquiry':
          prompt = this.buildPricingPrompt(data);
          break;
        case 'technical_support':
          prompt = this.buildTechnicalSupportPrompt(data);
          break;
        case 'renewal_assistance':
          prompt = this.buildRenewalPrompt(data);
          break;
        case 'general_inquiry':
          prompt = this.buildGeneralInquiryPrompt(data);
          break;
        default:
          prompt = `Responde de manera amigable y profesional a: ${data.message}`;
      }

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens
      });

      const response = completion.choices[0]?.message?.content?.trim();
      logger.success(`Specific GPT response generated for type: ${type}`);
      
      return response || this.getSpecificFallback(type, data);

    } catch (error) {
      logger.error(`Error generating specific GPT response for ${type}:`, error.message);
      return this.getSpecificFallback(type, data);
    }
  }

  // Analizar intención del mensaje
  async analyzeIntent(message) {
    try {
      if (!this.openai) {
        return this.analyzeIntentFallback(message);
      }

      const intentPrompt = `
Analiza la siguiente consulta y determina la intención principal:

Mensaje: "${message}"

Responde SOLO con una de estas opciones:
- pricing: Consulta sobre precios o planes
- technical: Problema técnico o soporte
- renewal: Renovación o vencimiento
- greeting: Saludo o inicio de conversación
- complaint: Queja o reclamo
- general: Consulta general
- other: Otro tipo de consulta

Intención:`;

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'user', content: intentPrompt }
        ],
        temperature: 0.1,
        max_tokens: 20
      });

      const intent = completion.choices[0]?.message?.content?.trim().toLowerCase();
      
      // Validar respuesta
      const validIntents = ['pricing', 'technical', 'renewal', 'greeting', 'complaint', 'general', 'other'];
      if (validIntents.includes(intent)) {
        return intent;
      } else {
        return 'general';
      }

    } catch (error) {
      logger.error('Error analyzing intent:', error.message);
      return this.analyzeIntentFallback(message);
    }
  }

  // Mejorar mensaje existente
  async enhanceMessage(originalMessage, improvements = []) {
    try {
      if (!this.openai) {
        return originalMessage;
      }

      const enhancePrompt = `
Mejora el siguiente mensaje de atención al cliente:

Mensaje original: "${originalMessage}"

Mejoras solicitadas:
${improvements.map(imp => `- ${imp}`).join('\n')}

Reglas:
- Mantén el mensaje profesional pero amigable
- Usa emojis apropiadamente
- Máximo 500 caracteres
- En español peruano

Mensaje mejorado:`;

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'user', content: enhancePrompt }
        ],
        temperature: 0.5,
        max_tokens: 200
      });

      const enhanced = completion.choices[0]?.message?.content?.trim();
      return enhanced || originalMessage;

    } catch (error) {
      logger.error('Error enhancing message:', error.message);
      return originalMessage;
    }
  }

  // Generar resumen de conversación
  async generateConversationSummary(messages) {
    try {
      if (!this.openai || messages.length === 0) {
        return 'No hay suficiente información para generar un resumen.';
      }

      const conversation = messages.map(msg => 
        `${msg.fromMe ? 'Agente' : 'Cliente'}: ${msg.message}`
      ).join('\n');

      const summaryPrompt = `
Genera un resumen breve de la siguiente conversación de atención al cliente:

${conversation}

Resumen (máximo 200 caracteres):`;

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'user', content: summaryPrompt }
        ],
        temperature: 0.3,
        max_tokens: 100
      });

      return completion.choices[0]?.message?.content?.trim() || 
             'Conversación sobre consulta de servicio.';

    } catch (error) {
      logger.error('Error generating conversation summary:', error.message);
      return 'Error generando resumen de conversación.';
    }
  }

  // System prompt básico
  getSystemPrompt() {
    return `Eres un asistente virtual especializado en atención al cliente para un negocio de suscripciones de streaming (Netflix, Disney+, etc.).

PERSONALIDAD:
- Amigable, profesional y empático
- Usa emojis apropiados
- Responde en español peruano
- Mantén un tono conversacional pero profesional

SERVICIOS QUE OFRECES:
- Netflix Premium/Familiar
- Disney+ 
- Prime Video
- HBO Max
- Spotify Premium
- YouTube Premium

INFORMACIÓN CLAVE:
- Planes desde S/15 mensuales
- Soporte 24/7 por WhatsApp
- Garantía de funcionamiento
- Métodos de pago: Yape, Plin, transferencia

INSTRUCCIONES:
1. Saluda cordialmente
2. Identifica la necesidad del cliente
3. Ofrece soluciones específicas
4. Solicita información si es necesaria
5. Cierra con próximos pasos claros

Si no puedes resolver algo, deriva con: "Un especialista te contactará pronto para ayudarte con esto 😊"`;
  }

  // Métodos auxiliares
  buildContextualPrompt(message, clientContext) {
    let prompt = `Mensaje del cliente: "${message}"`;
    
    if (clientContext) {
      prompt += `\n\nInformación del cliente:`;
      if (clientContext.name) prompt += `\n- Nombre: ${clientContext.name}`;
      if (clientContext.service) prompt += `\n- Servicio: ${clientContext.service}`;
      if (clientContext.plan) prompt += `\n- Plan: ${clientContext.plan}`;
      if (clientContext.status) prompt += `\n- Estado: ${clientContext.status}`;
      if (clientContext.expiry) prompt += `\n- Vencimiento: ${clientContext.expiry}`;
    }
    
    prompt += `\n\nResponde de manera personalizada y útil.`;
    return prompt;
  }

  buildPricingPrompt(data) {
    return `El cliente pregunta sobre precios o planes.
Consulta: "${data.message}"
Servicio de interés: ${data.service || 'No especificado'}

Proporciona información clara sobre nuestros planes de streaming.`;
  }

  buildTechnicalSupportPrompt(data) {
    return `El cliente tiene un problema técnico.
Problema: "${data.message}"
Servicio: ${data.service || 'No especificado'}

Proporciona soluciones paso a paso y mantén un tono empático.`;
  }

  buildRenewalPrompt(data) {
    return `El cliente consulta sobre renovación.
Consulta: "${data.message}"
Estado actual: ${data.status || 'No especificado'}

Ayuda con el proceso de renovación.`;
  }

  buildGeneralInquiryPrompt(data) {
    return `Consulta general del cliente.
Pregunta: "${data.message}"

Responde de manera informativa y amigable.`;
  }

  getFallbackResponse(message, clientContext = null) {
    // Respuestas automáticas básicas sin GPT
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('precio') || lowerMessage.includes('costo') || lowerMessage.includes('plan')) {
      return `¡Hola! 😊 Te ayudo con información sobre nuestros planes:\n\n📺 Netflix Premium: S/25/mes\n🏰 Disney+ Familiar: S/20/mes\n📦 Prime Video: S/15/mes\n\n¿Te interesa alguno en particular?`;
    }
    
    if (lowerMessage.includes('renovar') || lowerMessage.includes('vence') || lowerMessage.includes('pagar')) {
      const name = clientContext?.name || 'Cliente';
      return `¡Hola ${name}! 👋\n\nPara renovar tu suscripción puedes:\n💳 Transferencia bancaria\n📱 Yape/Plin\n💰 Efectivo\n\n¿Cuál prefieres? Te envío los datos enseguida 😊`;
    }
    
    if (lowerMessage.includes('problema') || lowerMessage.includes('error') || lowerMessage.includes('no funciona')) {
      return `¡Hola! Entiendo que tienes un problema técnico 🔧\n\nPara ayudarte mejor, necesito saber:\n1️⃣ ¿Qué dispositivo usas?\n2️⃣ ¿Qué error aparece?\n3️⃣ ¿Cuándo empezó?\n\n¡Te ayudo a solucionarlo! 💪`;
    }
    
    if (lowerMessage.includes('hola') || lowerMessage.includes('buenos') || lowerMessage.includes('buenas')) {
      return `¡Hola! 👋 ¿En qué puedo ayudarte hoy? Estoy aquí para resolver tus dudas sobre nuestros servicios 😊`;
    }
    
    // Respuesta genérica
    return `¡Hola! 👋 Gracias por contactarnos.\n\nUn miembro de nuestro equipo te responderá pronto. Mientras tanto, puedes escribir:\n• "PRECIOS" para ver planes\n• "RENOVAR" para información de pagos\n• "SOPORTE" para ayuda técnica\n\n¡Estamos aquí para ayudarte! 😊`;
  }

  getSpecificFallback(type, data) {
    switch (type) {
      case 'pricing_inquiry':
        return '📋 Nuestros planes:\n• Netflix Premium: S/25\n• Disney+: S/20\n• Prime Video: S/15\n\n¿Te interesa alguno?';
      case 'technical_support':
        return '🔧 Para soporte técnico:\n1. Reinicia la app\n2. Verifica internet\n3. Reinicia dispositivo\n\n¿Persiste el problema?';
      case 'renewal_assistance':
        return '💳 Para renovar:\n• Yape/Plin\n• Transferencia\n• Efectivo\n\n¿Cuál prefieres?';
      default:
        return '¡Hola! Un especialista te ayudará pronto 😊';
    }
  }

  analyzeIntentFallback(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('precio') || lowerMessage.includes('costo') || lowerMessage.includes('plan')) {
      return 'pricing';
    }
    if (lowerMessage.includes('problema') || lowerMessage.includes('error') || lowerMessage.includes('no funciona')) {
      return 'technical';
    }
    if (lowerMessage.includes('renovar') || lowerMessage.includes('vence') || lowerMessage.includes('pagar')) {
      return 'renewal';
    }
    if (lowerMessage.includes('hola') || lowerMessage.includes('buenos') || lowerMessage.includes('buenas')) {
      return 'greeting';
    }
    if (lowerMessage.includes('mal') || lowerMessage.includes('queja') || lowerMessage.includes('reclamo')) {
      return 'complaint';
    }
    
    return 'general';
  }

  generateCacheKey(message, context) {
    const contextString = context ? JSON.stringify(context) : '';
    return `${message}_${contextString}`.substring(0, 100);
  }

  cleanCache() {
    if (this.responseCache.size > 100) {
      const now = Date.now();
      for (const [key, value] of this.responseCache.entries()) {
        if (now - value.timestamp > this.cacheTimeout) {
          this.responseCache.delete(key);
        }
      }
    }
  }

  // Verificar configuración
  isConfigured() {
    return !!this.apiKey;
  }

  // Obtener estadísticas del servicio
  getStats() {
    return {
      configured: this.isConfigured(),
      model: this.model,
      cacheSize: this.responseCache.size,
      maxTokens: this.maxTokens,
      temperature: this.temperature
    };
  }
}

module.exports = new GPTService();