# Jatek Food Delivery Ecosystem

Full-stack food delivery platform with an Admin Dashboard and REST API powering orders, drivers, restaurants, customers, and real-time tracking.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, serves at `/api`)
- `pnpm --filter @workspace/mockup-sandbox run dev` — run the Admin Dashboard (port 8081, serves at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Optional env: `SESSION_SECRET` — for session signing; `TWILIO_*` for SMS OTP

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + Pino logging + helmet + rate-limiting + SSE
- DB: PostgreSQL + Drizzle ORM (23 tables)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec → `lib/api-client-react`, `lib/api-zod`)
- Dashboard: React + Vite + TailwindCSS + shadcn/ui + Wouter + React Query
- Build: esbuild (CJS bundle for API)

## Where things live

- `artifacts/api-server/src/routes/` — all Express route handlers
- `artifacts/api-server/src/lib/sse.ts` — SSE publish/subscribe (channel `admin_tracking`)
- `artifacts/api-server/src/lib/trackingService.ts` — GPS watchdog
- `artifacts/mockup-sandbox/src/pages/` — all admin dashboard pages
- `artifacts/mockup-sandbox/src/components/` — Layout, AuthGate, shadcn ui
- `lib/db/src/schema/` — Drizzle schema (source of truth for all 23 tables)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks
- `lib/api-zod/src/generated/api.ts` — generated Zod schemas

## Architecture decisions

- **Contract-first API**: OpenAPI spec drives both Zod validation on the server and React Query hooks on the client via Orval codegen. Run `pnpm --filter @workspace/api-spec run codegen` after spec changes.
- **SSE for real-time**: Server-Sent Events (not WebSocket/Socket.io) for live driver tracking and order status pushes. Admin dashboard subscribes to `admin_tracking` channel.
- **Admin auth separate**: Backend staff use `/api/backend/auth/login` with a separate JWT stored as `jatek_backend_token` in localStorage; customer auth uses `/api/auth/login`.
- **mockup-sandbox repurposed**: The Replit `design` artifact (originally a canvas sandbox) now hosts the Admin Dashboard at root `/`. Artifact kind cannot be changed after creation.
- **23-table Drizzle schema**: Copied from Jatekapoli reference app. Push with `pnpm --filter @workspace/db run push` (dev only).

## Product

- **Admin Dashboard** (`/`): Full web app for staff to manage orders, restaurants, products, categories, drivers, customers, staff roles, promotions, wallets, notifications, reviews, and reports. Login with `admin@jatek.ma`. Includes live driver tracking map (Google Maps + SSE on `admin_tracking` channel).
- **REST API** (`/api`): Serves all endpoints for the food delivery ecosystem — auth, orders, restaurants, menus, drivers, reviews, rewards, addresses, payment methods, support tickets, notifications, quotes, content (ads/shorts), promo codes, chat, and referrals.
- **Real-time tracking**: SSE endpoint at `/api/events` pushes driver location updates to the Admin Dashboard.

## User preferences

- Google Maps API key: user has their own key (`GOOGLE_MAPS_API_KEY` secret) for live driver tracking map
- Jatek brand colors: pink `#E91E63` primary, violet `#7C3AED` premium, orange `#EA580C` fast, dark bg `#0A1B3D`
- Three mobile apps (driver, client, merchant) deferred to future sessions
- Old workspace folders (`JatekPackageApps/`, `Jatekapoli-merchantanddriver/`, `Driver-MerchantDelivery/`) were deleted to free artifact slots

## Gotchas

- Express 5 param types: `req.params.id` is `string | string[]`. Use `(req.params.id as string)` or update `src/types.d.ts`. Does NOT block esbuild compilation.
- `verifyAndReplaceArtifactToml` cannot change artifact `kind`. The mockup-sandbox stays `kind = "design"` even though it now serves a web app.
- Port 8081 was originally used by the old mockup-sandbox canvas. If it's occupied, kill orphaned vite processes with `fuser -k 8081/tcp`.
- The admin dashboard workflow sometimes needs 2 restart attempts if orphaned vite processes are holding the port.
- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- Reference implementation: `/tmp/jatek-repos/Jatekapoli/` (backend-dashboard, api-server)
