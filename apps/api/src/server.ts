/** HTTP server bootstrap with graceful shutdown. */
import { createApp } from './app.js';
import { config } from './platform/config.js';
import { logger } from './platform/logger.js';
import { prisma } from './platform/db.js';

const app = createApp();
const server = app.listen(config.PORT, () => {
  logger.info(`Perfusio API listening on :${config.PORT}${config.apiPrefix}`);
});

async function shutdown(signal: string) {
  logger.info({ signal }, 'shutting down');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  // Force-exit if connections do not drain in time.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
