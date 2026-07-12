/**
 * Express application assembly. Security middleware, rate limiting, structured
 * request logging, the versioned API router, Swagger docs, and the central
 * error handler. Exported separately from the server so tests can mount it.
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { config } from './platform/config.js';
import { logger } from './platform/logger.js';
import { authenticate } from './http/middleware/auth.js';
import { errorHandler, notFoundHandler } from './http/middleware/errorHandler.js';
import { openapiSpec } from './http/openapi.js';
import { patientsRouter } from './modules/patients/patients.routes.js';
import { casesRouter } from './modules/cases/cases.routes.js';
import { perfusionRouter } from './modules/perfusion/perfusion.routes.js';
import { equipmentRouter } from './modules/equipment/equipment.routes.js';
import { dashboardRouter } from './modules/analytics/dashboard.routes.js';
import { researchRouter } from './modules/research/research.routes.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(pinoHttp({ logger }));

  // Basic API-wide rate limit; tighten per-route (e.g. auth) as needed.
  app.use(
    rateLimit({
      windowMs: 60_000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // Liveness — unauthenticated.
  app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

  const api = express.Router();

  // Docs are public so integrators can read them without a token.
  api.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
  api.get('/openapi.json', (_req, res) => res.json(openapiSpec));

  // Everything below requires authentication.
  api.use(authenticate);
  api.use('/patients', patientsRouter);
  api.use('/cases', casesRouter);
  api.use('/cases/:caseId', perfusionRouter); // /monitoring, /timeline
  api.use('/equipment', equipmentRouter);
  api.use('/dashboard', dashboardRouter);
  api.use('/research', researchRouter);

  app.use(config.apiPrefix, api);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
