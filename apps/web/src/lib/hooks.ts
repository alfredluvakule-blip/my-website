'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type { DashboardSummary, Paginated, PatientRow, CaseRow } from './types';

/** Dashboard summary. */
export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<{ data: DashboardSummary }>('/dashboard/summary'),
    select: (r) => r.data,
  });
}

export function useCasesByMonth() {
  return useQuery({
    queryKey: ['cases-by-month'],
    queryFn: () => api.get<{ data: Array<{ month: string; count: number }> }>('/dashboard/cases-by-month'),
    select: (r) => r.data,
  });
}

export function usePatients(q = '') {
  return useQuery({
    queryKey: ['patients', q],
    queryFn: () => api.get<Paginated<PatientRow>>(`/patients?q=${encodeURIComponent(q)}`),
  });
}

export function useCases(status?: string) {
  const query = status ? `?status=${status}` : '';
  return useQuery({
    queryKey: ['cases', status ?? 'all'],
    queryFn: () => api.get<Paginated<CaseRow>>(`/cases${query}`),
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post('/patients', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  });
}
