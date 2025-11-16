## Quick Orientation for AI Coding Agents

This project is a Vite + React (TypeScript) frontend that uses Firebase Auth + Firestore for user data and sample stock/dividend data. The goal of edits should preserve the app's runtime flow and Firebase security model.

- **Start the app:** `npm install` then `npm run dev` (Vite on `http://localhost:5173`). Production build: `npm run build` (`tsc -b` then `vite build`). Lint with `npm run lint`.
- **Env:** Configuration comes from `import.meta.env` and `.env` (see `.env.example`). Keys are `VITE_FIREBASE_*` and used in `src/firebase.ts`.

- **Auth flow & user creation:** `src/contexts/AuthContext.tsx` uses Firebase `onAuthStateChanged` and creates a Firestore `users/{uid}` document on first login. Avoid duplicating user creation logic or bypassing the `onAuthStateChanged` listener.

- **User data shape and location:** User price lines are stored under `users/{uid}/lines`. The `useUserData` hook (`src/hooks/useUserData.ts`) performs optimistic UI updates after `addDoc`, `deleteDoc`, `updateDoc`. When editing these flows, keep optimistic updates consistent with Firestore operations.

- **Stock & dividend data layout:** The app reads stock data from `stocks/{symbol}/monthly/{YYYY-MM}` documents and dividends from `stocks/{symbol}` (see `src/hooks/useStockData.ts`). Each monthly doc stores a `days` map of day -> OHLCV. When updating fetch logic, preserve the month/day ID formatting (`YYYY-MM` and day zero-pad).

- **Charting:** Charts use `lightweight-charts` (see `src/components/StockChart.tsx`). Price line features are managed in `PriceLineManager` and stored via `useUserData`.

- **Important patterns to follow:**
  - Use hooks in `src/hooks/*` for data access rather than ad-hoc Firestore queries in components.
  - Respect the `AuthProvider` gating: components assume `AuthContext` exposes `user` or `loading` and won't render until `AuthProvider` has set loading=false.
  - Keep Firestore path construction consistent with existing `doc(...)` usage to preserve security rules.

- **Security & rules:** README contains recommended Firestore rules restricting `users/{uid}` reads/writes to the authenticated owner. Do not change collection layout without coordinating rule changes.

- **Files to inspect for feature changes:**
  - `src/firebase.ts` — Firebase init and exported `auth`, `db`, `googleProvider`.
  - `src/contexts/AuthContext.tsx` — login/signup/logout and user doc creation.
  - `src/hooks/useUserData.ts` — add/remove/update price lines and optimistic updates.
  - `src/hooks/useStockData.ts` — how stock/dividend data is fetched and sorted.
  - `src/components/*` — UI components (PriceLineManager, StockChart, DividendInfo) that depend on hooks.

- **Build/test/debug notes:**
  - Vite dev server logs errors in console; use browser devtools to inspect script/runtime errors.
  - The `build` script calls `tsc -b` first — ensure TypeScript type errors are resolved before `vite build`.
  - There are no automated tests present. When adding tests, follow the existing TypeScript setup and keep test runners out of `devDependencies` additions unless discussed.

- **Common fixes / anti-patterns to avoid:**
  - Don't bypass `AuthContext` and directly read `localStorage` for auth state — this app relies on Firebase `onAuthStateChanged` for a single source of truth.
  - Avoid changing Firestore document shapes (e.g., swapping arrays for maps) without data migration code; hooks expect maps for monthly `days` and nested `dividends` keyed by year.

If anything here is unclear or you want more detail (e.g., exact Firestore example documents, UI flow for price-line edits), tell me which area to expand and I'll update this file.
