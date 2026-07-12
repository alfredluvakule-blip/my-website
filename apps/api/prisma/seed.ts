/**
 * Development seed. Creates one hospital, an admin + perfusionist profile, a
 * demo patient (with derived BSA/BMI), a scheduled case, a short timeline, and
 * a couple of equipment items. Idempotent on the hospital code.
 *
 * NOTE: Profiles mirror Supabase Auth users. In a real environment the auth
 * users are created via Supabase; here we insert profiles with fixed UUIDs so
 * local API calls with a self-signed dev JWT (sub = these ids) resolve.
 */
import { PrismaClient } from '@prisma/client';
import { bsaDuBois, bmi } from '@perfusio/clinical';

const prisma = new PrismaClient();

async function main() {
  const hospital = await prisma.hospital.upsert({
    where: { code: 'JKCI' },
    update: {},
    create: { name: 'Jakaya Kikwete Cardiac Institute', code: 'JKCI', timezone: 'Africa/Dar_es_Salaam' },
  });

  const admin = await prisma.profile.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      hospitalId: hospital.id,
      email: 'admin@jkci.perfusio.local',
      fullName: 'JKCI Administrator',
      role: 'ADMINISTRATOR',
    },
  });

  const perfusionist = await prisma.profile.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      hospitalId: hospital.id,
      email: 'perfusionist@jkci.perfusio.local',
      fullName: 'JKCI Perfusionist',
      role: 'PERFUSIONIST',
    },
  });

  const weightKg = 78;
  const heightCm = 176;
  const patient = await prisma.patient.upsert({
    where: { hospitalId_hospitalNumber: { hospitalId: hospital.id, hospitalNumber: 'MRN-0001' } },
    update: {},
    create: {
      hospitalId: hospital.id,
      hospitalNumber: 'MRN-0001',
      registrationNumber: 'REG-2026-0001',
      name: 'Demo Patient',
      age: 61,
      sex: 'MALE',
      weightKg,
      heightCm,
      bsaM2: Number(bsaDuBois(weightKg, heightCm).toFixed(2)),
      bmi: Number(bmi(weightKg, heightCm).toFixed(1)),
      bloodGroup: 'O_POS',
      diagnosis: 'Triple vessel coronary artery disease',
    },
  });

  const kase = await prisma.case.create({
    data: {
      hospitalId: hospital.id,
      patientId: patient.id,
      perfNo: 'PERF-2026-0001',
      procedure: 'CABG x3',
      operatingRoom: 'OR 2',
      scheduledDate: new Date(),
      priority: 'ELECTIVE',
      status: 'SCHEDULED',
      patientBloodVolumeMl: 5100,
      surgeonId: admin.id,
      perfusionistId: perfusionist.id,
    },
  });

  // A couple of JKCI structured sub-records for the demo case.
  await prisma.actCheckpointRecord.createMany({
    data: [
      { caseId: kase.id, checkpoint: 'BASELINE', actSeconds: 120, measuredAt: new Date() },
      { caseId: kase.id, checkpoint: 'POST_HEPARIN', actSeconds: 540, measuredAt: new Date(Date.now() + 25 * 60000) },
    ],
  });
  await prisma.oxygenator.create({
    data: {
      caseId: kase.id,
      manufacturer: 'Getinge',
      model: 'Quadrox-i Adult',
      serialNumber: 'SN-QX-88213',
      surfaceAreaM2: 1.8,
      maxFlowLmin: 7,
      primeVolumeMl: 250,
    },
  });

  await prisma.timelineEntry.createMany({
    data: [
      { caseId: kase.id, event: 'PATIENT_IN_OR', occurredAt: new Date() },
      { caseId: kase.id, event: 'HEPARIN_GIVEN', occurredAt: new Date(Date.now() + 25 * 60000) },
    ],
  });

  await prisma.equipmentItem.createMany({
    data: [
      {
        hospitalId: hospital.id,
        category: 'OXYGENATOR',
        manufacturer: 'Getinge',
        model: 'Quadrox-i Adult',
        specification: { surfaceAreaM2: 1.8, maxFlowLmin: 7 },
        quantityOnHand: 5,
      },
      {
        hospitalId: hospital.id,
        category: 'CANNULA',
        manufacturer: 'Medtronic',
        model: 'DLP Arterial 22Fr',
        specification: { sizeFr: 22 },
        quantityOnHand: 12,
      },
    ],
  });

  // eslint-disable-next-line no-console
  console.log('Seed complete:', { hospital: hospital.code, patient: patient.hospitalNumber, case: kase.id });
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
