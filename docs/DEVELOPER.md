# Developer guide

Conventions and module boundaries for contributing to Perfusio.

## Principles

1. **The API is the only writer of clinical data.** The browser reads via
   Supabase Realtime; it never writes clinical rows directly. This gives one
   place to enforce business rules and one place to write audit entries.
2. **Derived numbers are computed once, in `@perfusio/clinical`.** Never inline a
   clinical formula in a route or component. Add it to the package with a test,
   then import it. The server recomputes and persists; the client may preview
   using the *same* function.
3. **One schema per domain object, in `@perfusio/contracts`.** Forms and API
   validation import the same Zod schema. If a field changes, it changes once.
4. **Soft-delete, never hard-delete** clinical rows. Filter `deletedAt: null`.
5. **Audit every mutation.** Services call `recordAudit` on create/update/delete.

## API module shape

Each feature under `apps/api/src/modules/<feature>/`:

- `*.service.ts` — business logic, Prisma access, audit, derivation. Hospital-scoped.
- `*.routes.ts` — Express router: `requirePerm` guard → `validate(schema)` →
  `asyncHandler` calling the service. Thin; no business logic.
- `*.test.ts` — unit tests for pure logic (rules, permissions, anonymization).

Add a new module:
1. Define/extend the Zod schema in `@perfusio/contracts`.
2. Add the Prisma model (+ `npx prisma migrate dev`).
3. Write the service (scope by `hospitalId`, audit, derive via `@perfusio/clinical`).
4. Write the router and mount it in `src/app.ts`.
5. Add the path to `src/http/openapi.ts`.

## Web conventions

- Server data → **TanStack Query** hooks in `src/lib/hooks.ts` (never fetch in
  components directly except the couple of one-off queries in page files).
- UI-only state → **Zustand** (`src/lib/store.ts`). Auth/session → Supabase.
- Forms → **React Hook Form** + `zodResolver` with the shared contract.
- Reusable primitives live in `src/components/ui/`; feature components alongside
  or in `src/components/`.
- All colors come from CSS variables (`globals.css`) so light/dark and OR touch
  mode work everywhere.

## Adding a clinical calculation

```ts
// packages/clinical/src/myThing.ts
export function myThing(x: number): number {
  if (!Number.isFinite(x)) throw new RangeError('x invalid');
  return /* ... */;
}
```
Add a test in `packages/clinical/src/clinical.test.ts`, export it from
`src/index.ts`, rebuild the package, then import it in the API service and/or a
web component. The same function now backs both the stored value and the UI
preview.

## Alerts

Alert logic is pure and lives in `apps/api/src/modules/alerts/alertRules.ts`.
Thresholds are overridable per case. To add an alert: add the `AlertType` enum
value (contracts + Prisma), add a branch to `evaluateAlerts`, and a test case.
