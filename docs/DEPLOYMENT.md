# Deployment

Perfusio deploys as three managed pieces: **Supabase** (Postgres + Auth +
Realtime + Storage), the **Express API** (Railway), and the **Next.js web app**
(Vercel). Nginx + Docker Compose are provided for self-hosting or on-prem.

---

## 1. Supabase

1. Create a project at supabase.com. Note the project URL, `anon` key,
   `service_role` key, and the JWT secret (Settings → API).
2. Point Prisma at the database and apply the schema:
   ```bash
   export DATABASE_URL="postgresql://postgres:<pw>@db.<ref>.supabase.co:5432/postgres"
   export DIRECT_URL="$DATABASE_URL"
   npm run db:generate --workspace @perfusio/api
   npm run db:deploy   --workspace @perfusio/api   # prisma migrate deploy
   ```
3. Apply the Supabase-specific SQL in order (SQL editor or `supabase db push`):
   - `supabase/migrations/0001_session_context.sql`
   - `supabase/migrations/0002_rls_policies.sql`
   - `supabase/migrations/0003_realtime.sql`
4. In Auth settings, enable email confirmations and configure the password-reset
   redirect URL to your web domain.

> **Profiles ↔ Auth users.** Each `profiles.id` must equal a Supabase Auth user
> id. Create users in Supabase Auth, then insert a matching `profiles` row (role,
> hospital) via the admin flow or a trigger. The demo seed uses fixed UUIDs for
> local development only.

---

## 2. API on Railway

1. New Railway project → Deploy from repo. Set the build to use
   `apps/api/Dockerfile` (root context).
2. Environment variables:
   ```
   NODE_ENV=production
   PORT=4000
   DATABASE_URL=<supabase pooled connection string>
   DIRECT_URL=<supabase direct connection string>
   CORS_ORIGIN=https://<your-web-domain>
   SUPABASE_JWT_SECRET=<from Supabase>
   FIELD_ENCRYPTION_KEY=<32-byte hex, generate with: openssl rand -hex 32>
   ```
3. The container runs `prisma migrate deploy` on start, then boots the server.
4. Health check path: `/health`.

---

## 3. Web on Vercel

1. Import the repo. Set **Root Directory** to `apps/web`.
2. Vercel auto-detects Next.js. Environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
   NEXT_PUBLIC_API_URL=https://<your-railway-api-domain>/api/v1
   ```
3. Because the app is a monorepo, set the install command to run at the repo root
   so workspace packages resolve:
   `npm install` (Vercel runs it at the repo root automatically when Root
   Directory is a workspace member).

---

## 4. Self-hosting with Docker Compose

```bash
cp .env.example .env      # set SUPABASE_* and FIELD_ENCRYPTION_KEY
docker compose up --build
```

Brings up Postgres, the API (migrating on boot), the web app, and Nginx on
`http://localhost:8080`. For production, add a 443 server block to
`nginx/nginx.conf` with your TLS certificates and terminate HTTPS at Nginx.

---

## Backups & disaster recovery

- **Managed backups.** Supabase takes daily backups (Pro tier: point-in-time
  recovery). Enable PITR for a clinical system.
- **Logical backups.** Schedule `pg_dump` to object storage for an independent
  copy: `pg_dump "$DIRECT_URL" | gzip > perfusio-$(date +%F).sql.gz`.
- **Audit trail.** `audit_logs` is append-only and included in backups; it is the
  record of who changed what.
- **Soft delete.** Clinical rows are never hard-deleted (`deletedAt`), so
  accidental deletions are recoverable without restoring a backup.
- **Recovery drill.** Periodically restore a backup into a staging project and
  run the API's migrations + a smoke test to validate the recovery path.

---

## Security checklist for production

- [ ] `FIELD_ENCRYPTION_KEY` is a unique 32-byte value stored in a secrets manager.
- [ ] `SUPABASE_JWT_SECRET` matches the Supabase project and is not the dev default.
- [ ] HTTPS everywhere; HSTS at the edge.
- [ ] RLS policies applied (`0002_rls_policies.sql`) and verified with a
      non-service-role token.
- [ ] CORS restricted to the web domain.
- [ ] Rate limiting reviewed for your traffic profile.
- [ ] Backups + PITR enabled and a restore drill completed.
