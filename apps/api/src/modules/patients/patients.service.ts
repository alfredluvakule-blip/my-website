/**
 * Patient service.
 *
 * Owns the rule that BSA and BMI are derived — never trusted from input — using
 * @perfusio/clinical, and that all reads/writes are hospital-scoped and
 * soft-deleted rather than removed.
 */
import { bsaDuBois, bmi as calcBmi } from '@perfusio/clinical';
import type { PatientCreate, PatientUpdate, PaginationQuery } from '@perfusio/contracts';
import { prisma } from '../../platform/db.js';
import { errors } from '../../platform/errors.js';
import { recordAudit, type AuditContext } from '../../platform/audit.js';
import { toPrismaPage, pageMeta, orderBy } from '../../http/pagination.js';

function derive(weightKg: number, heightCm: number) {
  return {
    bsaM2: Number(bsaDuBois(weightKg, heightCm).toFixed(2)),
    bmi: Number(calcBmi(weightKg, heightCm).toFixed(1)),
  };
}

export const patientsService = {
  async list(hospitalId: string, q: PaginationQuery) {
    const where = {
      hospitalId,
      deletedAt: null,
      ...(q.q
        ? {
            OR: [
              { name: { contains: q.q, mode: 'insensitive' as const } },
              { hospitalNumber: { contains: q.q, mode: 'insensitive' as const } },
              { diagnosis: { contains: q.q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      prisma.patient.findMany({ where, ...toPrismaPage(q), orderBy: orderBy(q) }),
      prisma.patient.count({ where }),
    ]);
    return { data, meta: pageMeta(q, total) };
  },

  async get(hospitalId: string, id: string) {
    const patient = await prisma.patient.findFirst({
      where: { id, hospitalId, deletedAt: null },
    });
    if (!patient) throw errors.notFound('Patient not found');
    return patient;
  },

  async create(ctx: AuditContext & { hospitalId: string }, input: PatientCreate) {
    const derived = derive(input.weightKg, input.heightCm);
    try {
      const patient = await prisma.patient.create({
        data: {
          hospitalId: ctx.hospitalId,
          hospitalNumber: input.hospitalNumber,
          name: input.name,
          dateOfBirth: input.dateOfBirth ?? null,
          age: input.age ?? null,
          sex: input.sex,
          weightKg: input.weightKg,
          heightCm: input.heightCm,
          bloodGroup: input.bloodGroup,
          allergies: input.allergies,
          diagnosis: input.diagnosis ?? null,
          notes: input.notes ?? null,
          ...derived,
        },
      });
      await recordAudit({ ctx, action: 'patient.create', entity: 'Patient', entityId: patient.id, after: patient });
      return patient;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
        throw errors.conflict('A patient with this hospital number already exists');
      }
      throw err;
    }
  },

  async update(ctx: AuditContext & { hospitalId: string }, id: string, input: PatientUpdate) {
    const before = await this.get(ctx.hospitalId, id);
    const weightKg = input.weightKg ?? Number(before.weightKg);
    const heightCm = input.heightCm ?? Number(before.heightCm);
    const derived =
      input.weightKg !== undefined || input.heightCm !== undefined
        ? derive(weightKg, heightCm)
        : {};
    const patient = await prisma.patient.update({
      where: { id },
      data: { ...input, ...derived },
    });
    await recordAudit({ ctx, action: 'patient.update', entity: 'Patient', entityId: id, before, after: patient });
    return patient;
  },

  async softDelete(ctx: AuditContext & { hospitalId: string }, id: string) {
    const before = await this.get(ctx.hospitalId, id);
    await prisma.patient.update({ where: { id }, data: { deletedAt: new Date() } });
    await recordAudit({ ctx, action: 'patient.delete', entity: 'Patient', entityId: id, before });
  },
};
