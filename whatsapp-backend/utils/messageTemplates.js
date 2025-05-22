class MessageTemplates {
  
  // Plantillas de recordatorios
  getReminders() {
    return {
      // 3 días antes del vencimiento
      threeDays: `🔔 *Recordatorio Importante*

Hola {name}! 👋

Tu suscripción de *{service}* vencerá en *3 días* (📅 {expiry}).

Para evitar interrupciones en tu servicio, te recomendamos renovar cuanto antes.

💰 *Plan actual:* {plan}
📱 *¿Necesitas ayuda?* Solo responde a este mensaje

¡Gracias por elegirnos! 🙌`,

      // 2 días antes del vencimiento  
      twoDays: `⚠️ *Recordatorio Urgente*

Hola {name}! 👋

Tu suscripción de *{service}* vencerá en *2 días* (📅 {expiry}).

🚨 *¡Solo quedan 48 horas!*

Para renovar y mantener tu servicio activo:
💳 Realiza tu pago
📱 Confírmanos por este medio

*Plan:* {plan}

¡No te quedes sin tu servicio favorito! 💪`,

      // 1 día antes del vencimiento
      lastDay: `🚨 *ÚLTIMO DÍA - Acción Requerida*

¡Hola {name}! 

⏰ Tu suscripción de *{service}* vence *MAÑANA* ({expiry})

🔥 *¡ÚLTIMA OPORTUNIDAD!*

Renueva HOY para evitar:
❌ Pérdida de acceso
❌ Interrupción del servicio
❌ Pérdida de tu configuración

💰 *Plan:* {plan}
📲 *Responde YA para renovar*

¡No te quedes sin entretenimiento! 🎬`,

      // Día de vencimiento / Vencido
      expired: `🔴 *SERVICIO VENCIDO*

Hola {name},

Tu suscripción de *{service}* venció el {expiry}.

🚫 *Estado:* SUSPENDIDO

Para reactivar tu servicio:
1️⃣ Realiza el pago de renovación
2️⃣ Envíanos el comprobante
3️⃣ Tu servicio se reactiva inmediatamente

💡 *¿Quieres cambiar de plan?* 
¡Pregúntanos por nuestras ofertas!

Estamos aquí para ayudarte 💪`,

      // Plantilla general
      general: `📋 *Recordatorio de Suscripción*

Hola {name}! 👋

Tu suscripción de *{service}* está próxima a vencer.

📅 *Fecha de vencimiento:* {expiry}
📦 *Plan actual:* {plan}
⏰ *Días restantes:* {days}

Para renovar tu suscripción:
💳 Realiza tu pago
📱 Confírmanos por WhatsApp

¡Gracias por confiar en nosotros! 🌟`
    };
  }

  // Plantillas de bienvenida
  getWelcome() {
    return {
      newClient: `🎉 *¡Bienvenido a nuestra familia!*

Hola {name}! 👋

Gracias por confiar en nosotros para tu suscripción de *{service}*.

📋 *Detalles de tu suscripción:*
🎬 Servicio: {service}
📦 Plan: {plan}
📅 Vence: {expiry}
📱 Contacto: {phone}

💡 *Consejos importantes:*
• Guarda este número para futuras consultas
• Te recordaremos antes del vencimiento
• ¿Dudas? ¡Solo escríbenos!

¡Disfruta tu contenido favorito! 🍿✨`,

      renewal: `✅ *¡Suscripción Renovada Exitosamente!*

¡Hola {name}! 🎉

Tu suscripción de *{service}* ha sido renovada correctamente.

📋 *Nuevos detalles:*
📅 Nueva fecha de vencimiento: {expiry}
📦 Plan: {plan}
✅ Estado: ACTIVO

¡Puedes seguir disfrutando sin interrupciones! 🎬

Gracias por renovar con nosotros 💚`
    };
  }

  // Plantillas de soporte
  getSupport() {
    return {
      autoResponse: `🤖 *Respuesta Automática*

¡Hola! Gracias por contactarnos 👋

He recibido tu mensaje y un miembro de nuestro equipo te responderá pronto.

⏰ *Horarios de atención:*
Lunes a Viernes: 9:00 AM - 6:00 PM
Sábados: 9:00 AM - 2:00 PM

🔥 *Para consultas urgentes sobre:*
• Renovaciones → Escribe "RENOVAR"
• Problemas técnicos → Escribe "SOPORTE"  
• Cambio de plan → Escribe "PLANES"

¡Te ayudaremos pronto! 😊`,

      technicalSupport: `🔧 *Soporte Técnico*

Hola {name}! 👋

Entendemos que tienes un problema técnico con tu *{service}*.

📋 *Información que necesitamos:*
1️⃣ ¿Qué dispositivo usas?
2️⃣ ¿Qué error aparece?
3️⃣ ¿Cuándo empezó el problema?

💡 *Soluciones rápidas:*
• Cierra y abre la app
• Verifica tu conexión a internet
• Reinicia tu dispositivo

¿Sigue sin funcionar? Envíanos los detalles y te ayudamos! 🚀`,

      paymentReminder: `💳 *Recordatorio de Pago*

Hola {name}! 👋

Notamos que aún no hemos recibido tu pago para renovar *{service}*.

📅 *Vencimiento:* {expiry}
💰 *Plan:* {plan}

🏦 *Métodos de pago disponibles:*
• Transferencia bancaria
• Yape / Plin
• Efectivo (puntos autorizados)

Envíanos tu comprobante y renovamos inmediatamente ✅

¡Estamos aquí para ayudarte! 💪`
    };
  }

  // Plantillas promocionales
  getPromotions() {
    return {
      upgrade: `🔥 *¡Oferta Especial para Ti!*

Hola {name}! 👋

¿Te gusta tu *{service}*? 

🚀 *¡Mejora tu experiencia con nuestro plan Premium!*

✨ *Beneficios exclusivos:*
📺 Más pantallas simultáneas
🎬 Contenido 4K Ultra HD
🌍 Acceso internacional
⚡ Velocidad premium

💸 *Oferta limitada:* 50% OFF primer mes

¿Te interesa? ¡Responde "PREMIUM" y te damos más detalles! 🎉`,

      loyalty: `🏆 *¡Cliente VIP!*

¡Hola {name}! 👑

¡Felicidades! Has sido seleccionado como cliente VIP por tu fidelidad.

🎁 *Beneficios exclusivos:*
✅ Soporte prioritario 24/7
✅ Descuentos especiales
✅ Acceso anticipado a nuevos servicios
✅ Promociones exclusivas

💝 *Regalo especial:* 1 mes GRATIS en tu próxima renovación

Código: VIP{name}2025

¡Gracias por ser parte de nuestra familia! 💚`,

      referral: `🤝 *¡Programa de Referidos!*

Hola {name}! 👋

¿Conoces a alguien que necesite *{service}*?

🎯 *¡Gana refiriendo amigos!*

Por cada amigo que se suscriba:
💰 Tú ganas: 1 mes GRATIS
🎁 Tu amigo gana: 50% descuento

📱 *¿Cómo funciona?*
1️⃣ Comparte nuestro contacto
2️⃣ Que mencione tu nombre
3️⃣ ¡Ambos ganan!

¡Empieza a ganar hoy! 🚀`
    };
  }

  // Plantillas de GPT (contexto para IA)
  getGPTPrompts() {
    return {
      systemPrompt: `Eres un asistente virtual especializado en atención al cliente para un negocio de suscripciones de streaming (Netflix, Disney+, etc.).

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

Si no puedes resolver algo, deriva con: "Un especialista te contactará pronto para ayudarte con esto 😊"`,

      contextualPrompt: `Cliente: {name}
Servicio actual: {service}  
Plan: {plan}
Estado: {status}
Vencimiento: {expiry}
Teléfono: {phone}

Mensaje del cliente: "{message}"

Responde de manera personalizada considerando su información.`
    };
  }

  // Personalizar mensaje con datos del cliente
  personalizeMessage(template, client, extraData = {}) {
    let message = template;
    
    // Reemplazar variables básicas del cliente
    if (client) {
      message = message.replace(/\{name\}/g, client.name || 'Cliente');
      message = message.replace(/\{service\}/g, client.service || 'servicio');
      message = message.replace(/\{plan\}/g, client.plan || 'Estándar');
      message = message.replace(/\{expiry\}/g, client.expiry || 'próximamente');
      message = message.replace(/\{phone\}/g, client.phone || '');
      message = message.replace(/\{status\}/g, client.status || 'activo');
    }
    
    // Reemplazar datos extra
    for (const [key, value] of Object.entries(extraData)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      message = message.replace(regex, value);
    }
    
    return message;
  }

  // Obtener plantilla por tipo y clave
  getTemplate(type, key) {
    const templates = {
      reminders: this.getReminders(),
      welcome: this.getWelcome(),
      support: this.getSupport(),
      promotions: this.getPromotions(),
      gpt: this.getGPTPrompts()
    };
    
    return templates[type]?.[key] || null;
  }

  // Generar mensaje aleatorio de saludo
  getRandomGreeting() {
    const greetings = [
      '¡Hola! 👋',
      '¡Hola! ¿Cómo estás? 😊',
      '¡Buenos días! ☀️',
      '¡Hola! ¿En qué puedo ayudarte? 🤝',
      '¡Hola! Es un gusto saludarte 👋'
    ];
    
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // Generar despedida aleatoria
  getRandomFarewell() {
    const farewells = [
      '¡Que tengas un excelente día! 🌟',
      '¡Gracias por contactarnos! 😊',
      '¡Hasta pronto! 👋',
      '¡Cualquier duda, aquí estamos! 💪',
      '¡Disfruta tu contenido favorito! 🎬'
    ];
    
    return farewells[Math.floor(Math.random() * farewells.length)];
  }
}

module.exports = new MessageTemplates();