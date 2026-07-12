'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { patientCreateSchema, type PatientCreate } from '@perfusio/contracts';
import { useCreatePatient } from '@/lib/hooks';
import { ClinicalCalculators } from '@/components/clinical-calculators';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { ApiError } from '@/lib/api';

/**
 * Patient registration. Validates with the shared Zod contract, shows live
 * clinical calculations as the perfusionist types, and posts to the API which
 * re-derives and persists BSA/BMI authoritatively.
 */
export default function NewPatientPage() {
  const router = useRouter();
  const create = useCreatePatient();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PatientCreate>({
    resolver: zodResolver(patientCreateSchema),
    defaultValues: { sex: 'MALE', bloodGroup: 'UNKNOWN', allergies: [] },
  });

  const weightKg = Number(watch('weightKg')) || 0;
  const heightCm = Number(watch('heightCm')) || 0;
  const sex = watch('sex');

  async function onSubmit(values: PatientCreate) {
    try {
      const res = (await create.mutateAsync(values)) as { data: { id: string } };
      router.push(`/patients/${res.data.id}`);
    } catch (err) {
      // Surfaced below via create.error
      if (!(err instanceof ApiError)) throw err;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Register patient</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Patient details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
              <Field label="Hospital number" error={errors.hospitalNumber?.message}>
                <Input {...register('hospitalNumber')} />
              </Field>
              <Field label="Full name" error={errors.name?.message}>
                <Input {...register('name')} />
              </Field>
              <Field label="Age (years)" error={errors.age?.message}>
                <Input type="number" {...register('age', { valueAsNumber: true })} />
              </Field>
              <Field label="Sex" error={errors.sex?.message}>
                <select
                  {...register('sex')}
                  className="h-11 w-full rounded-md border border-input bg-background px-3"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                  <option value="UNKNOWN">Unknown</option>
                </select>
              </Field>
              <Field label="Weight (kg)" error={errors.weightKg?.message}>
                <Input type="number" step="0.1" {...register('weightKg', { valueAsNumber: true })} />
              </Field>
              <Field label="Height (cm)" error={errors.heightCm?.message}>
                <Input type="number" step="0.1" {...register('heightCm', { valueAsNumber: true })} />
              </Field>
              <Field label="Blood group" error={errors.bloodGroup?.message}>
                <select
                  {...register('bloodGroup')}
                  className="h-11 w-full rounded-md border border-input bg-background px-3"
                >
                  {['O_POS', 'O_NEG', 'A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'UNKNOWN'].map(
                    (g) => (
                      <option key={g} value={g}>
                        {g.replace('_', ' ')}
                      </option>
                    ),
                  )}
                </select>
              </Field>
              <Field label="Diagnosis" error={errors.diagnosis?.message} full>
                <Input {...register('diagnosis')} />
              </Field>

              {create.isError && (
                <p className="col-span-2 text-sm text-danger">
                  {(create.error as ApiError)?.message ?? 'Could not save patient'}
                </p>
              )}

              <div className="col-span-2 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? 'Saving…' : 'Register patient'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-1">
          <ClinicalCalculators
            weightKg={weightKg}
            heightCm={heightCm}
            sex={sex === 'FEMALE' ? 'female' : sex === 'MALE' ? 'male' : 'unknown'}
          />
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  full,
  children,
}: {
  label: string;
  error?: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${full ? 'col-span-2' : ''}`}>
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
