# Jatek Food Delivery Ecosystem

Full-stack food delivery platform: Admin Dashboard + REST API + App Mobile Livreur.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API server (port 8080, `/api`)
- `pnpm --filter @workspace/mockup-sandbox run dev` — Admin Dashboard (port 8081, `/`)
- `pnpm --filter @workspace/livreur run dev` — App mobile Livreur (Expo Go)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — régénérer hooks + Zod depuis OpenAPI
- `pnpm --filter @workspace/db run push` — push DB schema (dev only)
- Required env: `DATABASE_URL`, `GOOGLE_MAPS_API_KEY`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + Pino + helmet + rate-limiting + SSE
- DB: PostgreSQL + Drizzle ORM (23 tables)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (OpenAPI spec → `lib/api-client-react`, `lib/api-zod`)
- Dashboard: React + Vite + TailwindCSS + shadcn/ui + Wouter + React Query
- Livreur: Expo (SDK 54) + expo-router + React Query + expo-location + react-native-maps@1.18.0
- Build: esbuild (CJS bundle for API)

## Where things live

- `artifacts/api-server/src/routes/` — tous les handlers Express
- `artifacts/api-server/src/lib/sse.ts` — SSE pub/sub (canal `admin_tracking`)
- `artifacts/mockup-sandbox/src/pages/` — pages du dashboard admin
- `artifacts/livreur/app/` — screens Expo (auth gate, login, tabs, order detail)
- `artifacts/livreur/contexts/` — AuthContext, LocationTrackingContext
- `artifacts/livreur/lib/storage.ts` — shim SecureStore/localStorage cross-platform
- `lib/db/src/schema/` — schéma Drizzle (source de vérité)
- `lib/api-spec/openapi.yaml` — spec OpenAPI (source de vérité)
- `lib/api-client-react/src/generated/api.ts` — hooks React Query générés

## Architecture decisions

- **Contract-first API**: la spec OpenAPI pilote Zod côté serveur et les hooks côté client via Orval.
- **SSE pour le temps réel**: le dashboard admin subscribe à `admin_tracking`; les clients subscribent à `order:N`; les livreurs à `driver:N`.
- **Deux systèmes d'auth**: staff → `/api/backend/auth/login` (token `jatek_backend_token`); clients/livreurs → `/api/auth/login` (role-based).
- **storage.ts shim**: `expo-secure-store` ne marche pas sur web → shim avec `localStorage` sur web et SecureStore sur natif.
- **react-native-maps stub web**: metro.config.js redirige l'import vers `stubs/react-native-maps.web.js` sur le bundle web.
- **Une seule app mobile par projet Replit**: Client et Marchand sont dans des projets séparés.

## Product

- **Admin Dashboard** (`/`): Gestion commandes, restaurants, livreurs, clients, staff, promos, wallets. Carte de tracking en direct (Google Maps + SSE `admin_tracking`). Login: `admin@jatek.ma`.
- **REST API** (`/api`): Tous les endpoints — auth, orders, restaurants, menus, drivers, reviews, rewards, addresses, payment methods, tickets, notifications, quotes, content, promo codes, chat, referrals. Inclut `/drivers/me`.
- **App Livreur** (`/livreur/`): Auth email/password, toggle en-ligne/hors-ligne, broadcast GPS en temps réel vers dashboard admin, liste commandes, carte, gains, profil.

## User preferences

- Jatek brand: pink `#E91E63` primaire, violet `#7C3AED`, orange `#EA580C`, dark bg `#0A1B3D`
- UI en français pour les apps mobiles
- Apps Client et Marchand → projets Replit séparés (limite: 1 app mobile par projet)

## Gotchas

- `expo-secure-store@~15.0.8` requis (pas 55.x) pour Expo SDK 54.
- `react-native-maps` doit être pincé à `1.18.0` — ne pas l'ajouter aux plugins de app.json.
- Express 5: `req.params.id` est `string | string[]`. Caster avec `(req.params.id as string)`.
- Toujours lancer `pnpm --filter @workspace/api-spec run codegen` après changement de `openapi.yaml`.
- Port 8081 parfois bloqué par vite orphelin → `fuser -k 8081/tcp`.

## Pointers

- Skill `pnpm-workspace` pour la structure monorepo et TypeScript
- Skill `expo` pour les patterns mobiles Expo Go
