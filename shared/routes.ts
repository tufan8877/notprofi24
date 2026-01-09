import { z } from 'zod';
import { 
  insertSettingsSchema, 
  insertPropertyManagerSchema, 
  insertCompanySchema, 
  insertJobSchema,
  insertJobReportSchema,
  insertCooperationSchema,
  settings, propertyManagers, companies, jobs, jobReports, invoices, cooperations 
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  // === SETTINGS ===
  settings: {
    get: {
      method: 'GET' as const,
      path: '/api/settings',
      responses: {
        200: z.custom<typeof settings.$inferSelect>(),
      },
    },
    update: {
      method: 'POST' as const,
      path: '/api/settings',
      input: insertSettingsSchema,
      responses: {
        200: z.custom<typeof settings.$inferSelect>(),
      },
    },
  },

  // === PROPERTY MANAGERS ===
  propertyManagers: {
    list: {
      method: 'GET' as const,
      path: '/api/property-managers',
      responses: {
        200: z.array(z.custom<typeof propertyManagers.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/property-managers/:id',
      responses: {
        200: z.custom<typeof propertyManagers.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/property-managers',
      input: insertPropertyManagerSchema,
      responses: {
        201: z.custom<typeof propertyManagers.$inferSelect>(),
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/property-managers/:id',
      input: insertPropertyManagerSchema.partial(),
      responses: {
        200: z.custom<typeof propertyManagers.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/property-managers/:id',
      responses: {
        204: z.void(),
      },
    },
  },

  // === COMPANIES ===
  companies: {
    list: {
      method: 'GET' as const,
      path: '/api/companies',
      responses: {
        200: z.array(z.custom<typeof companies.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/companies/:id',
      responses: {
        200: z.custom<typeof companies.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/companies',
      input: insertCompanySchema,
      responses: {
        201: z.custom<typeof companies.$inferSelect>(),
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/companies/:id',
      input: insertCompanySchema.partial(),
      responses: {
        200: z.custom<typeof companies.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/companies/:id',
      responses: {
        204: z.void(),
      },
    },
  },

  // === JOBS ===
  jobs: {
    list: {
      method: 'GET' as const,
      path: '/api/jobs',
      responses: {
        200: z.array(z.custom<typeof jobs.$inferSelect & { company: typeof companies.$inferSelect, propertyManager: typeof propertyManagers.$inferSelect }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/jobs/:id',
      responses: {
        200: z.custom<typeof jobs.$inferSelect & { report?: typeof jobReports.$inferSelect }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/jobs',
      input: insertJobSchema,
      responses: {
        201: z.custom<typeof jobs.$inferSelect>(),
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/jobs/:id',
      input: insertJobSchema.partial().extend({ status: z.string().optional() }),
      responses: {
        200: z.custom<typeof jobs.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },

  // === JOB REPORTS ===
  reports: {
    createOrUpdate: {
      method: 'POST' as const,
      path: '/api/jobs/:jobId/report',
      input: insertJobReportSchema.omit({ jobId: true }),
      responses: {
        200: z.custom<typeof jobReports.$inferSelect>(),
      },
    },
  },

  // === INVOICES ===
  invoices: {
    list: {
      method: 'GET' as const,
      path: '/api/invoices',
      responses: {
        200: z.array(z.custom<typeof invoices.$inferSelect & { company: typeof companies.$inferSelect }>()),
      },
    },
    generate: {
      method: 'POST' as const,
      path: '/api/invoices/generate',
      input: z.object({ monthYear: z.string() }), // "YYYY-MM"
      responses: {
        201: z.array(z.custom<typeof invoices.$inferSelect>()),
      },
    },
    markPaid: {
      method: 'PATCH' as const,
      path: '/api/invoices/:id/pay',
      input: z.object({ paidAt: z.string() }),
      responses: {
        200: z.custom<typeof invoices.$inferSelect>(),
      },
    },
  },
  
  // === COOPERATIONS ===
  cooperations: {
    toggle: {
      method: 'POST' as const,
      path: '/api/cooperations',
      input: insertCooperationSchema,
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/cooperations',
      responses: {
         200: z.array(z.custom<typeof cooperations.$inferSelect>()),
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
