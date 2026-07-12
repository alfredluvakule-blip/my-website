-- ============================================================================
-- 0001_session_context.sql
-- Session-context helpers used by the API and by RLS policies.
--
-- The Express API is the only writer of clinical data. Per transaction it sets
-- app.current_user_id and app.current_hospital_id (see apps/api withUserContext),
-- and these helper functions expose them to RLS policies as defense in depth.
-- ============================================================================

create schema if not exists app;

create or replace function app.current_user_id() returns uuid
  language sql stable as $$
    select nullif(current_setting('app.current_user_id', true), '')::uuid
  $$;

create or replace function app.current_hospital_id() returns uuid
  language sql stable as $$
    select nullif(current_setting('app.current_hospital_id', true), '')::uuid
  $$;
