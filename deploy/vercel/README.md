# Deploy the BMH Perfusion Record to Vercel (static — cannot fail to build)

This folder is a **pure static site**: just `index.html` + `vercel.json`. There is
no build step, no backend, no database, and no environment variables, so the
deploy cannot produce a build error.

## Option A — Vercel dashboard (import from GitHub)

1. Go to **vercel.com → Add New → Project** and import this repository.
2. In project settings set **Root Directory** to:
   ```
   deploy/vercel
   ```
3. **Framework Preset:** Other. Leave Build Command and Output Directory empty
   (this folder has no `package.json`, so Vercel serves the files as-is).
4. Click **Deploy**. Your record is live at `https://<project>.vercel.app`.

## Option B — Vercel CLI (fastest)

```bash
npm i -g vercel
cd deploy/vercel
vercel --prod
```

## Option C — drag & drop

On the Vercel dashboard, drag this `deploy/vercel` folder onto the "Add New →
Project" drop zone. It deploys instantly as a static site.

---

**Why this instead of deploying the repo root?** The repository root is the full
Next.js + Express monorepo, which needs a Postgres database and Supabase keys to
build — that is what produced your error. This folder is the standalone,
offline-capable record and needs none of that. The two can coexist: use this for
an instant, always-working deploy; wire up the full stack later when the database
and Supabase project are ready (see `docs/DEPLOYMENT.md`).
