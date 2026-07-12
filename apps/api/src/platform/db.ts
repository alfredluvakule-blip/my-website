/**
 * Prisma client singleton.
 *
 * The API connects with elevated privileges and is the only writer of clinical
 * data. Per-request it sets Postgres session variables (app.current_user_id,
 * app.current_hospital_id) so the SQL-level RLS policies act as defense in
 * depth even for reads that bypass the API.
 */
import { PrismaClient } from '@prisma/client';
import { config } from './config.js';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: config.isProd ? ['warn', 'error'] : ['warn', 'error'],
  });

if (!config.isProd) globalForPrisma.prisma = prisma;

/**
 * Run `fn` inside a transaction that has the caller's identity set as Postgres
 * session context, so RLS and audit triggers see who is acting.
 */
export async function withUserContext<T>(
  ctx: { userId: string; hospitalId: string },
  fn: (tx: Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SELECT set_config('app.current_user_id', $1, true)`, ctx.userId);
    await tx.$executeRawUnsafe(
      `SELECT set_config('app.current_hospital_id', $1, true)`,
      ctx.hospitalId,
    );
    return fn(tx);
  });
}
