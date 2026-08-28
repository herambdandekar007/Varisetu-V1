# AGENTS.md — WariSetu (Varisetu-V1)

## Quick Commands

- `npm run dev` — Vite dev server (port 5173)
- `npm run build` — Production build (outputs to `dist/`). ~76s. Passes clean.
- `npm run preview` — Serve production build locally
- **No lint, format, or typecheck scripts exist.** No ESLint, Prettier, or TypeScript compiler configured. The project uses `.jsx` files with `src/types/*.d.ts` ambient type hints only.

## Architecture

**Single Vite + React SPA. No monorepo, no separate backend server.**

All backend lives in Supabase:
- **Postgres + RLS** — all data, auth, row-level security
- **Supabase Realtime** — Postgres change streams via `supabase.channel()` in service files
- **1 Edge Function** — `supabase/functions/route-advisor/index.ts` (OSRM walking routes + Nominatim geocoding + optional LLM analysis via OpenRouter/NVIDIA NIM)
- **Auth** — `@supabase/supabase-js` with `supabase.auth.getSession()` / `onAuthStateChange`

Supabase client singleton: `src/services/supabase.js` (hard-codes URL + anon key as fallbacks when env vars are missing).

## Environment

Copy `.env.example` → `.env`. Required vars:
```
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```
Optional: `VITE_API_BASE_URL` (axios base for external API, currently unused by most services).

**WARNING:** `env.example` (root, no dot prefix) contains a `VITE_SUPABASE_SERVICE_KEY` (service_role JWT). This key bypasses RLS and must never be used in client code.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18.3 + Vite 5.4 |
| Routing | react-router-dom 6.26 |
| Styling | Tailwind 3.4 (custom theme: `saffron`, `forest`, `ink`, `cloud` colors; `DM Sans` + `Playfair Display` fonts) |
| Animation | Framer Motion 11 |
| Maps | react-leaflet 4 + Leaflet 1.9 |
| Charts | Recharts 2.12 |
| Icons | @heroicons/react 2, react-icons 5, lucide-react |
| Notifications | react-hot-toast (in-app only) |
| i18n | i18next + react-i18next (en/hi/mr, **fallback language: mr (Marathi)**) |
| HTTP | Axios (only `src/services/api.js` uses it; most services use Supabase client directly) |

## Auth & Roles

Auth lives in `src/context/AuthContext.jsx`.

**DB → UI role mapping** (`DB_ROLE_TO_UI_ROLE`):
- `PILGRIM` / `warkari` → `pilgrim`
- `CONTROLLER` / `police` → `police`
- `VOLUNTEER` → `volunteer`
- `medical` → `medical`
- `municipality` → `municipality`

Profile row is fetched from `profiles` table on auth state change. Role is stored as `profiles.role`.

**There is no `ambulance_driver` role yet.** Adding one requires: updating the `profiles_role_check` CHECK constraint in a new migration, adding the mapping in `DB_ROLE_TO_UI_ROLE` / `UI_ROLE_TO_DB_ROLE`, and adding it to `roleRoutes.js`.

## Routing

`src/App.jsx` defines all routes. Pattern:

```
<Routes>
  {/* Public: /, /login, /register, /auth/callback, etc. */}
  <Route element={<ProtectedRoute />}>
    <Route element={<RoleLayout />}>
      {/* Shared: /profile, /settings, /accessibility */}
      <Route element={<RoleProtectedRoute allowedRoles={['pilgrim']} />}>
        {/* Pilgrim routes: /dashboard, /crowd, /navigation, etc. */}
      </Route>
      <Route element={<RoleProtectedRoute allowedRoles={['volunteer']} />}>
        {/* /volunteer/* */}
      </Route>
      {/* medical, police (/controller/*), municipality */}
    </Route>
  </Route>
</Routes>
```

Role → home path mapping: `src/routes/roleRoutes.js`:
- pilgrim → `/dashboard`
- volunteer → `/volunteer/dashboard`
- medical → `/medical/dashboard`
- police → `/controller/dashboard`
- municipality → `/municipality/dashboard`

**When adding a new role**: add to `roleRoutes.js`, add route group in `App.jsx`, add sidebar component, register in `sidebarMap` in `RoleLayout.jsx`.

## Sidebar / Navigation

`src/layouts/RoleLayout.jsx` maps `role` → sidebar component via `sidebarMap`:
```js
const sidebarMap = { pilgrim, volunteer, medical, police, municipality };
```

Each sidebar is in `src/components/sidebars/<Role>Sidebar.jsx`. Pattern: array of nav items with `{ name, to, icon }`, rendered as `<NavLink>` with framer-motion active indicator. Grouped under labeled sections ("My Journey", "Journey", "Services & Camps", "Safety Center", etc.).

Mobile nav: `src/components/sidebars/MobileNavigation.jsx`.

## Service Pattern (data layer)

All services in `src/services/` follow this pattern:
1. Module-level cache (`let cache = []`) + subscriber set (`const subscribers = new Set()`)
2. `notify()` iterates subscribers with current cache
3. `load()` fetches from Supabase, updates cache, calls `notify()`
4. `ensure()` lazy-loads on first access
5. Supabase Realtime channel for live updates (fallback: polling)
6. Exported as singleton objects (`export const crowdService = { ... }`)

Two service utilities:
- `src/services/_store.js` — generic pub/sub store factory (`createStore`)
- `src/services/api.js` — Axios instance (base URL from env), mostly stubs

## State Management

No Redux/Zustand. Two layers:
- **`AppContext.jsx`** (~956 lines) — central state for crowd simulation, incidents, tasks, alerts, camps, routes, weather, AI, health, group tracking. Large monolith.
- **Service singletons** — each manages its own cache + Supabase realtime subscriptions. Services are imported into `AppContext` and wired to React state.

## SQL Migrations

Location: `supabase/migrations/`. Numbered with gaps (001–003, then 013+).

**Convention: ADDITIVE ONLY.** Never drop existing tables or columns. Use `IF NOT EXISTS`, `DROP POLICY IF EXISTS` before `CREATE POLICY`.

RLS helper: `public.current_user_role()` reads `profiles.role` for `auth.uid()`.
Timestamp trigger: `public.set_current_timestamp_updated_at()`.

**Key constraint:** `resources.type` CHECK only allows: `MEDICAL, WATER, FOOD, TOILET, CAMP, AMBULANCE, REST, MEDICINE, DOCTOR, BARRICADE`. No `HOSPITAL` type. New migration needed to add types.

Migration numbering: next should be `018_*.sql`.

## Features & Route Map

| Feature | Path | Sidebar | Role |
|---|---|---|---|
| Dashboard | `/dashboard` | PilgrimSidebar | pilgrim |
| Crowd Watch | `/crowd` | PilgrimSidebar + PoliceSidebar | pilgrim, police |
| Smart Route | `/navigation` | PilgrimSidebar + PoliceSidebar | pilgrim, police |
| Resources | `/resources` | PilgrimSidebar + PoliceSidebar | pilgrim, police |
| Medical Dashboard | `/medical/dashboard` | MedicalSidebar | medical |
| Ambulances | `/medical/ambulances` | MedicalSidebar | medical |
| Medical Camps | `/medical/camps` | MedicalSidebar | medical |
| Alerts | `/alerts` | PilgrimSidebar | pilgrim |
| Emergency Center | `/emergency` | PilgrimSidebar | pilgrim |
| Police Dashboard | `/controller/dashboard` | PoliceSidebar | police |

**Existing AmbulancesPage** (`src/pages/Medical/AmbulancesPage.jsx`) is a static list filtering `resources` where `type === 'AMBULANCE'`. No live tracking, no driver auth, no status modes.

## Important Gotchas

- **No push notifications exist.** `NotificationDrawer.jsx` shows in-app notifications only (from mock data in `AppContext`). No FCM, no service worker, no APNs. Building emergency alerts requires adding a full push notification stack.
- **No hospital type in resources table.** Must add via migration before hospital-related features.
- **Hard-coded Supabase credentials** in `src/services/supabase.js` fallback — these are the anon key (safe for client) but the pattern is fragile. Prefer env vars.
- **`AppContext.jsx` is a 956-line monolith.** New global state should be added carefully or extracted into a separate context/service.
- **The `data/` directory contains mock/demo data** (`mockData.js`, `demoData.js`). Many features render from these mocks when Supabase data is empty. New features can follow this pattern for demo mode.
- **i18n fallback is Marathi (mr).** If adding user-facing strings, add to all three locale files under `src/locales/`. For MVP/hackathon, English-only in new features is acceptable but add TODO comments.
- **`src/utils/format.js`** exports `cn()` (classname merge utility, likely clsx/twMerge pattern) and formatting helpers. Use `cn()` for conditional Tailwind classes.
- **Lazy loading pattern**: most pages use `lazy(() => import(...))` wrapped in `<Suspense fallback={<SkeletonPage />}>`. Eager imports in `App.jsx` are for non-critical or role-specific pages that are small.

## For the Ambulance Emergency Feature

Key integration points for the new feature:
- **New role**: Add `ambulance_driver` to `profiles_role_check` CHECK constraint, `DB_ROLE_TO_UI_ROLE`, `UI_ROLE_TO_DB_ROLE`, `roleRoutes.js`, `sidebarMap` in `RoleLayout.jsx`
- **New sidebar**: `src/components/sidebars/AmbulanceSidebar.jsx` (driver console) + add "Ambulance Status" link to `PilgrimSidebar.jsx` and `VolunteerSidebar.jsx`
- **New tables**: `ambulances` table (with RLS), potentially `ambulance_route_trails`, `ambulance_alerts`
- **New service**: `src/services/ambulanceService.js` following the pub/sub + Supabase Realtime pattern
- **New pages**: `src/pages/Ambulance/AmbulanceConsole.jsx` (driver), `src/pages/Ambulance/AmbulanceStatus.jsx` (pilgrim view)
- **Map overlay**: Extend `src/components/maps/` with ambulance markers and route polylines
- **Realtime location**: Use Supabase Realtime channels for broadcasting ambulance location to nearby users
- **OSRM routing**: Reuse `supabase/functions/route-advisor/index.ts` pattern or call OSRM directly from client (already done in `src/services/routeAdvisorService.js`)
- **Crowd map integration**: Extend `CrowdPage.jsx` / map components to overlay ambulance icons when in EMERGENCY mode
