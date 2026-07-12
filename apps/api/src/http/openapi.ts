/**
 * OpenAPI 3.1 description of the public API. Kept hand-authored and concise;
 * request/response shapes are governed by the zod schemas in @perfusio/contracts.
 * Served at /api/v1/docs via swagger-ui-express.
 */
export const openapiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Perfusio API',
    version: '0.1.0',
    description:
      'REST API for the Perfusio Cardiopulmonary Bypass Perfusion Recording System. ' +
      'All endpoints require a Supabase-issued Bearer JWT and are scoped to the caller’s hospital.',
  },
  servers: [{ url: '/api/v1' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: {},
            },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/health': {
      get: { summary: 'Liveness probe', security: [], responses: { '200': { description: 'OK' } } },
    },
    '/patients': {
      get: {
        summary: 'List patients (paginated, searchable)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer' } },
          { name: 'q', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Paginated patient list' } },
      },
      post: { summary: 'Register a patient (BSA/BMI derived server-side)', responses: { '201': { description: 'Created' } } },
    },
    '/patients/{id}': {
      get: { summary: 'Get a patient', responses: { '200': { description: 'Patient' }, '404': { description: 'Not found' } } },
      patch: { summary: 'Update a patient', responses: { '200': { description: 'Updated' } } },
      delete: { summary: 'Soft-delete a patient', responses: { '204': { description: 'Deleted' } } },
    },
    '/cases': {
      get: { summary: 'List cases (filter by status)', responses: { '200': { description: 'Paginated case list' } } },
      post: { summary: 'Create a case (target flow derived)', responses: { '201': { description: 'Created' } } },
    },
    '/cases/{id}': {
      get: { summary: 'Get a case with circuit, timeline, and doses', responses: { '200': { description: 'Case' } } },
      patch: { summary: 'Update a case', responses: { '200': { description: 'Updated' } } },
      delete: { summary: 'Soft-delete a case', responses: { '204': { description: 'Deleted' } } },
    },
    '/cases/{caseId}/monitoring': {
      get: { summary: 'List monitoring records', responses: { '200': { description: 'Records' } } },
      post: {
        summary: 'Add a monitoring record (derives DO2i/CI, evaluates alerts)',
        responses: { '201': { description: 'Created with any triggered alerts' } },
      },
    },
    '/cases/{caseId}/timeline': {
      get: { summary: 'List timeline events', responses: { '200': { description: 'Events' } } },
      post: { summary: 'Add a timeline event (recomputes CPB/clamp durations)', responses: { '201': { description: 'Created' } } },
    },
    '/equipment': {
      get: { summary: 'List equipment library items', responses: { '200': { description: 'Items' } } },
      post: { summary: 'Add an equipment item', responses: { '201': { description: 'Created' } } },
    },
    '/dashboard/summary': {
      get: { summary: 'Dashboard case counts and mean perfusion metrics', responses: { '200': { description: 'Summary' } } },
    },
    '/research/dataset': {
      get: {
        summary: 'Export an anonymized research dataset (JSON or CSV)',
        parameters: [{ name: 'format', in: 'query', schema: { type: 'string', enum: ['json', 'csv'] } }],
        responses: { '200': { description: 'De-identified dataset' } },
      },
    },
  },
} as const;
