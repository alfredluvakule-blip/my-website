-- ============================================================================
-- 0003_realtime.sql
-- Publish the tables the OR monitoring screen subscribes to for live updates.
-- The browser subscribes read-only; RLS (0002) still governs what it can see.
-- ============================================================================

alter publication supabase_realtime add table public.monitoring_records;
alter publication supabase_realtime add table public.timeline_entries;
alter publication supabase_realtime add table public.alerts;
alter publication supabase_realtime add table public.cases;
