# VSU SmartMap

Smart, offline-friendly campus navigation for Visayas State University. Browse facilities, search rooms, chat with an AI assistant, and manage data through a secure admin console.

![VSU SmartMap Banner](public/vsu-banner-21x9.png)

## Quick Links
- Map: `/`
- Directory: `/directory`
- Chat: `/chat`
- Admin: `/admin`
- Offline page: `/offline`

## Overview
- Interactive Leaflet map with category pins and selection sheet
- Directory with search/filter and map handoff
- AI chat assistant for natural language location queries (Gemini via Genkit)
- User suggestions (add/edit) with admin review and approval
- Offline-ready PWA with cached tiles/data and an offline landing page
- Admin dashboard for facilities/rooms CRUD and suggestion approvals
- Accessibility-focused (keyboardable tabs, focus rings, ARIA labelling)

## Tech Stack
- Next.js 16 (App Router, Turbopack), React 19, TypeScript
- Tailwind CSS + shadcn/ui, lucide-react
- Supabase (Postgres, Auth, Storage)
- Leaflet/react-leaflet for mapping
- Genkit + Google Gemini for chat

## Requirements
- Node.js 20+
- npm 10+
- Supabase project (URL, anon key, service role key)
- MapTiler key for tiles
- Gemini API keys (CSV) for chat

## Getting Started
1. Install dependencies
   ```bash
   npm install
   ```
2. Copy env template and fill in values
   ```bash
   cp .env.example .env.local
   ```
3. Run the app
   ```bash
   npm run dev
   ```

## Supabase Setup
- Apply SQL migrations in `supabase/migrations/` (run in timestamp order).
- Optional: seed data via `supabase/seed.sql` (safe to re-run for dev).
- Storage bucket `smartmap-bucket` is created by migrations and must remain public for image reads.

## Environment Variables
Notes:
- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only (never expose it in the client).

```
NEXT_PUBLIC_SUPABASE_URL=...           # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=...      # Supabase anon/publishable key
SUPABASE_SERVICE_ROLE_KEY=...          # Service role key (admin actions)
NEXT_PUBLIC_MAPTILER_KEY=...           # MapTiler API key
GEMINI_API_KEYS=key1,key2,...          # Comma-separated Gemini API keys
GEMINI_MODEL=gemini-flash-lite-latest  # Gemini model name
```

## Scripts
- `npm run dev` — start Next.js (Turbopack)
- `npm run build` — production build
- `npm run start` — serve production build
- `npm run lint` — ESLint
- `npm run ai:dev` — start Genkit dev server

## Project Structure
- `app/(student)` — student-facing map, directory, chat, info, offline
- `app/admin` — admin shell and CRUD flows
- `app/api` — API routes (chat)
- `components` — shared UI/map/admin/chat components
- `lib` — supabase clients, queries, context, constants, AI helpers
- `public/sw.js` — custom service worker for offline caching

## Offline & PWA
- Service worker caches static assets, map tiles, and public Supabase facility/room endpoints
- Offline page at `/offline` with retry/back-to-map actions
- Facilities and chat history cached locally (with TTL/quotas)
- Manifest/icons included for installability; theme color matches brand green

## Admin Access
- Admin console at `/admin` (Supabase Auth protected)
- Facilities/rooms CRUD, image upload (Supabase Storage), suggestion approvals, activity history
- Server actions require `SUPABASE_SERVICE_ROLE_KEY`

## Contributing (Gitflow)
- Base branch: `develop`
- Branch naming: `feature/<slug>`, `fix/<slug>`, `hotfix/<slug>`
- Commits: Conventional Commits (`feat(scope): ...`, `fix(scope): ...`, `docs(scope): ...`, `chore(scope): ...`)
- Keep PRs small, avoid redundant commits, and run `npm run lint` + `npm run build` before opening a PR

## QA & Verification
- Lint: `npm run lint`
- Build: `npm run build`
- Manual flows to verify before release:
  - Map load, pin selection, category filter, search
  - Directory search/filter and “View on Map” handoff
  - Chat: send/stream responses, follow-ups, rate-limit messaging
  - Suggest add/edit flows and admin approval/rejection
  - Admin CRUD (facilities, rooms, images, history)
  - Offline: visit `/offline`, toggle network to confirm cached tiles/data
  - PWA install prompt on mobile/desktop

## Deployment Notes
- Ensure env vars are set in the hosting platform (Supabase + Gemini + MapTiler)
- Turbopack root is pinned in `next.config.ts` to avoid multi-lockfile resolution issues
- Use `npm run build && npm run start` for production runs

## Troubleshooting
- Turbopack root warnings: already pinned via `turbopack.root` in `next.config.ts`
- Stale browser baseline warning: update `baseline-browser-mapping` (dev dep) if tooling requests
- Service worker cache misses: clear browser storage and revisit the map to warm caches
