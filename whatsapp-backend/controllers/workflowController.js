const axios = require('axios');
const logger = require('../utils/logger');
const Client = require('../models/Client');
const Message = require('../models/Message');

class WorkflowController {
  constructor() {
    this.n8nUrl = process.env.N8N_URL || 'http://localhost:5678';
    this.n8nApiKey = process.env.N8N_API_KEY;
    this.webhookBaseUrl = process.env.N8N_WEBHOOK_BASE_URL || 'http://localhost:5678/webhook';
    
    // Cliente HTTP para n8n
    this.n8nClient = axios.create({
      baseURL: this.n8nUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        ...(this.n8nApiKey && { 'X-N8N-API-KEY': this.n8nApiKey })
      }
    });
  }

  // Obtener todos los workflows activos
  async getActiveWorkflows(req, res) {
    try {
      const response = await this.n8nClient.get('/api/v1/workflows');
      
      const activeWorkflows = response.data.data
        .filter(workflow => workflow.active)
        .map(workflow => ({
          id: workflow.id,
          name: workflow.name,
          active: workflow.active,
          createdAt: workflow.createdAt,
          updatedAt: workflow.updatedAt,
          tags: workflow.tags || [],
          nodes: workflow.nodes?.length || 0,
          connections: Object.keys(workflow.connections || {}).length
        }));

      res.json({
        success: true,
        data: activeWorkflows
      });

    } catch (error) {
      logger.error('Error getting active workflows:', error.message);
      
      // Si n8n no está disponible, devolver workflows mockups
      const mockWorkflows = this.getMockWorkflows();
      
      res.json({
        success: true,
        data: mockWorkflows,
        note: 'Using mock data - n8n not available'
      });
    }
  }

  // Obtener detalles de un workflow específico
  async getWorkflowDetails(req, res) {
    try {
      const { workflowId } = req.params;
      
      const [workflowResponse, executionsResponse] = await Promise.all([
        this.n8nClient.get(`/api/v1/workflows/${workflowId}`),
        this.n8nClient.get(`/api/v1/executions?workflowId=${workflowId}&limit=10`)
      ]);

      const workflow = workflowResponse.data.data;
      const executions = executionsResponse.data.data;

      const details = {
        id: workflow.id,
        name: workflow.name,
        active: workflow.active,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt,
        tags: workflow.tags || [],
        nodes: workflow.nodes || [],
        connections: workflow.connections || {},
        settings: workflow.settings || {},
        recentExecutions: executions.map(exec => ({
          id: exec.id,
          finished: exec.finished,
          mode: exec.mode,
          startedAt: exec.startedAt,
          stoppedAt: exec.stoppedAt,
          status: exec.finished ? 'success' : 'error'
        }))
      };

      res.json({
        success: true,
        data: details
      });

    } catch (error) {
      logger.error(`Error getting workflow ${req.params.workflowId}:`, error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get workflow details',
        details: error.message
      });
    }
  }

  // Ejecutar workflow manualmente
  async executeWorkflow(req, res) {
    try {
      const { workflowId } = req.params;
      const { data: inputData = {} } = req.body;

      const response = await this.n8nClient.post(`/api/v1/workflows/${workflowId}/execute`, {
        data: inputData
      });

      logger.success(`Workflow ${workflowId} executed manually`);

      res.json({
        success: true,
        data: {
          executionId: response.data.data.executionId,
          status: 'started',
          workflowId: workflowId
        }
      });

    } catch (error) {
      logger.error(`Error executing workflow ${req.params.workflowId}:`, error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to execute workflow',
        details: error.message
      });
    }
  }

  // Activar/Desactivar workflow
  async toggleWorkflow(req, res) {
    try {
      const { workflowId } = req.params;
      const { active } = req.body;

      const response = await this.n8nClient.patch(`/api/v1/workflows/${workflowId}`, {
        active: active
      });

      logger.info(`Workflow ${workflowId} ${active ? 'activated' : 'deactivated'}`);

      res.json({
        success: true,
        data: {
          workflowId: workflowId,
          active: active,
          updated: true
        }
      });

    } catch (error) {
      logger.error(`Error toggling workflow ${req.params.workflowId}:`, error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to toggle workflow',
        details: error.message
      });
    }
  }

  // Disparar webhook específico para recordatorios
  async triggerReminderWorkflow(req, res) {
    try {
      const { clientIds, messageTemplate, scheduleFor } = req.body;

      if (!clientIds || !Array.isArray(clientIds)) {
        return res.status(400).json({
          success: false,
          error: 'Client IDs array is required'
        });
      }

      // Obtener datos de los clientes
      const clients = [];
      for (const clientId of clientIds) {
        const client = await Client.findById(clientId);
        if (client) {
          clients.push(client);
        }
      }

      // Preparar payload para n8n
      const webhookPayload = {
        trigger: 'reminder_workflow',
        timestamp: new Date().toISOString(),
        data: {
          clients: clients,
          messageTemplate: messageTemplate,
          scheduleFor: scheduleFor,
          source: 'whatsapp_backend'
        }
      };

      // Disparar webhook
      const webhookUrl = `${this.webhookBaseUrl}/reminder-trigger`;
      const response = await axios.post(webhookUrl, webhookPayload);

      logger.success(`Reminder workflow triggered for ${clients.length} clients`);

      res.json({
        success: true,
        data: {
          executionId: response.data.executionId,
          clientsProcessed: clients.length,
          status: 'triggered'
        }
      });

    } catch (error) {
      logger.error('Error triggering reminder workflow:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to trigger reminder workflow',
        details: error.message
      });
    }
  }

  // Disparar workflow de respuesta automática con GPT
  async triggerAutoResponseWorkflow(req, res) {
    try {
      const { phone, message, clientContext } = req.body;

      if (!phone || !message) {
        return res.status(400).json({
          success: false,
          error: 'Phone and message are required'
        });
      }

      const webhookPayload = {
        trigger: 'auto_response',
        timestamp: new Date().toISOString(),
        data: {
          phone: phone,
          message: message,
          clientContext: clientContext,
          source: 'whatsapp_incoming'
        }
      };

      const webhookUrl = `${this.webhookBaseUrl}/auto-response`;
      const response = await axios.post(webhookUrl, webhookPayload);

      logger.info(`Auto-response workflow triggered for ${phone}`);

      res.json({
        success: true,
        data: {
          executionId: response.data.executionId,
          status: 'processing'
        }
      });

    } catch (error) {
      logger.error('Error triggering auto-response workflow:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to trigger auto-response workflow',
        details: error.message
      });
    }
  }

  // Obtener estadísticas de ejecuciones
  async getExecutionStats(req, res) {
    try {
      const { days = 7 } = req.query;
      const since = new Date();
      since.setDate(since.getDate() - parseInt(days));

      const response = await this.n8nClient.get('/api/v1/executions', {
        params: {
          limit: 100,
          includeData: false
        }
      });

      const executions = response.data.data;
      const recentExecutions = executions.filter(exec => 
        new Date(exec.startedAt) >= since
      );

      const stats = {
        total: recentExecutions.length,
        successful: recentExecutions.filter(exec => exec.finished && !exec.stoppedAt).length,
        failed: recentExecutions.filter(exec => exec.stoppedAt && !exec.finished).length,
        running: recentExecutions.filter(exec => !exec.finished && !exec.stoppedAt).length,
        byWorkflow: this.groupExecutionsByWorkflow(recentExecutions),
        dailyActivity: this.calculateDailyActivity(recentExecutions, days)
      };

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Error getting execution stats:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get execution statistics',
        details: error.message
      });
    }
  }

  // Crear workflow personalizado
  async createCustomWorkflow(req, res) {
    try {
      const { name, description, triggers, actions } = req.body;

      if (!name || !triggers || !actions) {
        return res.status(400).json({
          success: false,
          error: 'Name, triggers, and actions are required'
        });
      }

      // Generar estructura básica de workflow para n8n
      const workflowData = this.generateWorkflowStructure(name, description, triggers, actions);

      const response = await this.n8nClient.post('/api/v1/workflows', workflowData);

      logger.success(`Custom workflow created: ${name}`);

      res.json({
        success: true,
        data: {
          workflowId: response.data.data.id,
          name: name,
          status: 'created'
        }
      });

    } catch (error) {
      logger.error('Error creating custom workflow:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to create custom workflow',
        details: error.message
      });
    }
  }

  // Health check para n8n
  async healthCheck(req, res) {
    try {
      const response = await this.n8nClient.get('/healthz');
      
      res.json({
        success: true,
        data: {
          status: 'healthy',
          n8nVersion: response.headers['x-n8n-version'] || 'unknown',
          responseTime: Date.now() - req.startTime,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      res.status(503).json({
        success: false,
        error: 'n8n service unavailable',
        details: error.message
      });
    }
  }

  // Métodos auxiliares
  getMockWorkflows() {
    return [
      {
        id: 'mock_1',
        name: 'Recordatorios de Vencimiento',
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['reminders', 'whatsapp'],
        nodes: 5,
        connections: 4
      },
      {
        id: 'mock_2',
        name: 'Respuestas Automáticas GPT',
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['gpt', 'automation'],
        nodes: 7,
        connections: 6
      },
      {
        id: 'mock_3',
        name: 'Backup de Datos',
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['backup', 'maintenance'],
        nodes: 3,
        connections: 2
      }
    ];
  }

  groupExecutionsByWorkflow(executions) {
    const grouped = {};
    
    executions.forEach(exec => {
      const workflowId = exec.workflowId || 'unknown';
      if (!grouped[workflowId]) {
        grouped[workflowId] = { total: 0, successful: 0, failed: 0 };
      }
      
      grouped[workflowId].total++;
      if (exec.finished && !exec.stoppedAt) {
        grouped[workflowId].successful++;
      } else if (exec.stoppedAt) {
        grouped[workflowId].failed++;
      }
    });
    
    return grouped;
  }

  calculateDailyActivity(executions, days) {
    const daily = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      day.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);
      
      const dayExecutions = executions.filter(exec => {
        const execDate = new Date(exec.startedAt);
        return execDate >= day && execDate < nextDay;
      });
      
      daily.push({
        date: day.toISOString().split('T')[0],
        count: dayExecutions.length
      });
    }
    
    return daily;
  }

  generateWorkflowStructure(name, description, triggers, actions) {
    // Estructura básica para crear workflows en n8n
    return {
      name: name,
      active: false,
      nodes: [
        {
          parameters: {},
          name: "Start",
          type: "n8n-nodes-base.start",
          typeVersion: 1,
          position: [240, 300]
        },
        // Agregar más nodos basados en triggers y actions
        ...this.generateNodesFromConfig(triggers, actions)
      ],
      connections: this.generateConnectionsFromNodes(triggers, actions),
      settings: {
        saveDataErrorExecution: "all",
        saveDataSuccessExecution: "all",
        saveManualExecutions: true
      },
      staticData: null,
      tags: [name.toLowerCase().replace(/\s+/g, '-')],
      meta: {
        description: description || `Auto-generated workflow: ${name}`
      }
    };
  }

  generateNodesFromConfig(triggers, actions) {
    // Implementación básica - en un sistema real esto sería más complejo
    const nodes = [];
    
    triggers.forEach((trigger, index) => {
      nodes.push({
        parameters: trigger.parameters || {},
        name: `Trigger_${index + 1}`,
        type: trigger.type || "n8n-nodes-base.webhook",
        typeVersion: 1,
        position: [240 + (index * 200), 400]
      });
    });
    
    actions.forEach((action, index) => {
      nodes.push({
        parameters: action.parameters || {},
        name: `Action_${index + 1}`,
        type: action.type || "n8n-nodes-base.function",
        typeVersion: 1,
        position: [240 + (index * 200), 600]
      });
    });
    
    return nodes;
  }

  generateConnectionsFromNodes(triggers, actions) {
    // Generar conexiones básicas entre nodos
    const connections = {};
    
    // Conectar Start con primer trigger
    if (triggers.length > 0) {
      connections["Start"] = {
        main: [[{ node: "Trigger_1", type: "main", index: 0 }]]
      };
    }
    
    // Conectar triggers con actions
    triggers.forEach((_, triggerIndex) => {
      if (actions.length > triggerIndex) {
        const triggerName = `Trigger_${triggerIndex + 1}`;
        const actionName = `Action_${triggerIndex + 1}`;
        
        connections[triggerName] = {
          main: [[{ node: actionName, type: "main", index: 0 }]]
        };
      }
    });
    
    return connections;
  }
}

module.exports = new WorkflowController();