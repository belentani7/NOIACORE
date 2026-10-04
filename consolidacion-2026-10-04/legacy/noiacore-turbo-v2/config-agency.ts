export const AGENCY_CONFIG = {
  // API Providers
  providers: {
    groq: {
      name: "Groq",
      priority: 1,
      costPerToken: 0.0002,
      rateLimit: 30000, // requests/min
      freeTokensDaily: true,
      models: ["mixtral-8x7b-32768", "llama2-70b-4096"]
    },
    anthropic: {
      name: "Anthropic (Claude)",
      priority: 2,
      costPerToken: 0.003,
      rateLimit: 50,
      models: ["claude-3-opus", "claude-3-sonnet"]
    },
    deepseek: {
      name: "DeepSeek",
      priority: 3,
      costPerToken: 0.0001,
      rateLimit: 60,
      models: ["deepseek-coder"]
    },
    qwen: {
      name: "Qwen (Local)",
      priority: 4,
      costPerToken: 0,
      rateLimit: 1000,
      local: true,
      models: ["qwen3-coder:30b"]
    }
  },

  // Tiers
  tiers: {
    free: {
      name: "Free",
      monthlyQuota: 10000,
      price: 0,
      features: ["basic_tasks", "1_concurrent", "community_support"]
    },
    pro: {
      name: "Pro",
      monthlyQuota: 1000000,
      price: 99,
      features: ["priority_tasks", "5_concurrent", "email_support", "webhooks"]
    },
    enterprise: {
      name: "Enterprise",
      monthlyQuota: "unlimited",
      price: 999,
      features: ["priority_tasks", "20_concurrent", "phone_support", "webhooks", "sso", "audit_logs"]
    }
  },

  // Agents
  agents: {
    opencode: {
      name: "OpenCode",
      description: "Fast code generation",
      provider: "groq",
      timeout: 300000,
      retries: 2
    },
    claude: {
      name: "Claude Code",
      description: "Advanced reasoning",
      provider: "anthropic",
      timeout: 600000,
      retries: 1
    },
    mimo: {
      name: "MiMo Code",
      description: "Long-horizon tasks",
      provider: "deepseek",
      timeout: 900000,
      retries: 2
    },
    architect: {
      name: "Architect",
      description: "System design",
      provider: "groq",
      timeout: 300000,
      retries: 2
    }
  },

  // Rate limits
  rateLimits: {
    free: {
      requestsPerMinute: 10,
      tasksPerDay: 100,
      concurrentTasks: 1
    },
    pro: {
      requestsPerMinute: 100,
      tasksPerDay: 1000,
      concurrentTasks: 5
    },
    enterprise: {
      requestsPerMinute: 1000,
      tasksPerDay: 10000,
      concurrentTasks: 20
    }
  },

  // Features
  features: {
    webhooks: true,
    apiKeys: true,
    auditLog: true,
    metering: true,
    billing: true,
    sso: false
  },

  // Security
  security: {
    tokenExpiry: "24h",
    hashRounds: 12,
    encryptionAlgorithm: "aes-256-cbc",
    requireTwoFactor: false,
    ipWhitelist: false
  },

  // Performance
  performance: {
    maxConcurrentTasks: 20,
    taskTimeout: 600000, // 10 minutes
    webhookTimeout: 30000,
    cacheEnabled: true,
    cacheTTL: 300000
  }
};

export const PROMPTS = {
  decompose: `Descompón la siguiente tarea en subtareas ejecutables específicas.

  RETORNA SOLO JSON válido (sin markdown):
  [
    {"description": "subtarea 1", "agent": "opencode|claude|mimo|architect", "priority": 1},
    {"description": "subtarea 2", "agent": "opencode|claude|mimo|architect", "priority": 2},
    ...
  ]

  Reglas:
  - Máximo 10 subtareas
  - Cada subtarea debe ser completa y autónoma
  - Ordena por dependencias (priority)
  - Elige agent según complejidad (architect=diseño, claude=razonamiento, opencode=código, mimo=largo horizonte)

  Tarea: `,

  validate: `Valida que el siguiente JSON sea sintácticamente correcto:

  Retorna: {"valid": true|false, "errors": []}`,

  execute: `Ejecuta la siguiente tarea con máxima calidad y precisión.

  Contexto: Eres parte de una empresa autónoma de IA. El código debe ser:
  - Production-ready
  - Bien documentado
  - Con manejo de errores
  - Seguro (sin vulnerabilidades)
  - Optimizado (performance)

  Tarea: `
};

export const WEBHOOKS = {
  events: ["task.started", "task.completed", "task.failed", "task.updated"],
  retryPolicy: {
    maxRetries: 3,
    backoffMultiplier: 2,
    initialDelay: 1000
  },
  timeout: 30000
};
