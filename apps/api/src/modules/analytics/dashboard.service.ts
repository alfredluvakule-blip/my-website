/**
 * Dashboard aggregates. Read-only, hospital-scoped summaries powering the
 * landing dashboard: case counts by status, and mean perfusion metrics.
 */
import { prisma } from '../../platform/db.js';

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export const dashboardService = {
  async summary(hospitalId: string) {
    const today = startOfToday();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const base = { hospitalId, deletedAt: null } as const;

    const [todaysCases, running, completed, cancelled, avgAgg, completedCases] = await Promise.all([
      prisma.case.count({ where: { ...base, scheduledDate: { gte: today, lt: tomorrow } } }),
      prisma.case.count({ where: { ...base, status: { in: ['IN_OR', 'ON_BYPASS', 'WEANING'] } } }),
      prisma.case.count({ where: { ...base, status: 'COMPLETED' } }),
      prisma.case.count({ where: { ...base, status: 'CANCELLED' } }),
      prisma.case.aggregate({
        where: { ...base, status: 'COMPLETED' },
        _avg: { cpbTimeMin: true, crossClampTimeMin: true },
      }),
      prisma.case.findMany({
        where: { ...base, status: 'COMPLETED' },
        select: { id: true },
      }),
    ]);

    // Mean ACT / temperature / flow across monitoring records of completed cases.
    const monitoringAgg = await prisma.monitoringRecord.aggregate({
      where: { caseId: { in: completedCases.map((c) => c.id) } },
      _avg: { act: true, nasopharyngealTempC: true, pumpFlowLmin: true },
    });

    return {
      cases: { today: todaysCases, running, completed, cancelled },
      perfusion: {
        avgCpbTimeMin: round(avgAgg._avg.cpbTimeMin),
        avgCrossClampTimeMin: round(avgAgg._avg.crossClampTimeMin),
        avgAct: round(monitoringAgg._avg.act),
        avgTemperatureC: round(toNum(monitoringAgg._avg.nasopharyngealTempC), 1),
        avgFlowLmin: round(toNum(monitoringAgg._avg.pumpFlowLmin), 2),
      },
    };
  },

  /** Case volume grouped by calendar month for the current year. */
  async casesByMonth(hospitalId: string) {
    const rows = await prisma.$queryRawUnsafe<Array<{ month: string; count: bigint }>>(
      `SELECT to_char(date_trunc('month', "scheduledDate"), 'YYYY-MM') AS month, count(*)::bigint AS count
         FROM "cases"
        WHERE "hospitalId" = $1 AND "deletedAt" IS NULL
          AND "scheduledDate" >= date_trunc('year', now())
        GROUP BY 1 ORDER BY 1`,
      hospitalId,
    );
    return rows.map((r) => ({ month: r.month, count: Number(r.count) }));
  },
};

function toNum(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  return Number(v);
}
function round(v: number | null, digits = 0): number | null {
  if (v === null) return null;
  const f = 10 ** digits;
  return Math.round(v * f) / f;
}
