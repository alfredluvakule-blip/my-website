/** Structured logging with pino. Redacts anything that looks like a secret. */
import { pino } from 'pino';
import { config } from './config.js';

export const logger = pino({
  level: config.LOG_LEVEL,
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token'],
    censor: '[redacted]',
  },
  transport: config.isProd
    ? undefined
    : { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } },
});
