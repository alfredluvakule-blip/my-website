-- ============================================================================
-- 0002_rls_policies.sql
-- Row-level security: tenant isolation by hospital, plus a hard block on
-- reading soft-deleted rows through the realtime/browser path.
--
-- Run this AFTER `prisma migrate deploy` has created the public tables. RLS is
-- defense in depth — the API already authorises every request — but it is what
-- protects the data if the browser talks to Supabase directly for realtime, or
-- if an API bug slips through.
-- ============================================================================

alter table public.hospitals          enable row level security;
alter table public.profiles           enable row level security;
alter table public.patients           enable row level security;
alter table public.cases              enable row level security;
alter table public.cannulae           enable row level security;
alter table public.oxygenators        enable row level security;
alter table public.cardioplegia_doses enable row level security;
alter table public.heparin_doses      enable row level security;
alter table public.protamine_doses    enable row level security;
alter table public.timeline_entries   enable row level security;
alter table public.monitoring_records enable row level security;
alter table public.alerts             enable row level security;
alter table public.equipment_items    enable row level security;
alter table public.audit_logs         enable row level security;

-- Tenant read policies. Writes go through the service role (API), which bypasses
-- RLS; these SELECT policies gate the anon/authenticated realtime path.
create policy hospital_self on public.hospitals
  for select using (id = app.current_hospital_id());

create policy patients_same_hospital on public.patients
  for select using (hospital_id = app.current_hospital_id() and deleted_at is null);

create policy cases_same_hospital on public.cases
  for select using (hospital_id = app.current_hospital_id() and deleted_at is null);

create policy equipment_same_hospital on public.equipment_items
  for select using (hospital_id = app.current_hospital_id() and deleted_at is null);

-- Case-scoped children: visible when their parent case is in the caller's hospital.
create policy monitoring_by_case on public.monitoring_records
  for select using (
    exists (
      select 1 from public.cases c
      where c.id = monitoring_records.case_id
        and c.hospital_id = app.current_hospital_id()
        and c.deleted_at is null
    )
  );

create policy timeline_by_case on public.timeline_entries
  for select using (
    exists (
      select 1 from public.cases c
      where c.id = timeline_entries.case_id
        and c.hospital_id = app.current_hospital_id()
    )
  );

create policy alerts_by_case on public.alerts
  for select using (
    exists (
      select 1 from public.cases c
      where c.id = alerts.case_id
        and c.hospital_id = app.current_hospital_id()
    )
  );

-- Audit logs are never exposed to the browser: no SELECT policy → no rows.
-- (The API reads them via the service role for the admin audit view.)
