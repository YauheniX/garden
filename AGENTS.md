# AGENTS.md — PandaFloristBot (Telegram Mini App)

## 1. Project Overview
**PandaFloristBot** is a cozy 3D Low-Poly tabletop diorama game built as a Telegram Mini App.
- **Theme & Visuals:** Cute animals & pandas. The player is a Panda Florist running a bamboo-roofed flower stall on a wooden tabletop diorama (inspired by cozy low-poly games with warm flat-shaded 3D geometry and minimalist cream-colored bottom sheets + frosted-glass top HUD).
- **Core Loop:** Grow flowers on garden plots in real time (affected by weather, water, and fertilizer) → craft 3–5 flower bouquets (freeform or secret recipes) → sell to visiting animal NPCs → buy rare seeds/recipe scrolls from traveling merchants → upgrade plots/decor and gift bouquets to Telegram friends.

## 2. Tech Stack
- **Framework:** React 19 + TypeScript (`strict: true`) + Vite (`base: '/garden/'`)
- **3D Engine:** Three.js + `@react-three/fiber` (v9+) + `@react-three/drei`
- **State Management:** Zustand (with `persist` middleware, key: `panda-florist-save-v1`)
- **Styling & UI:** Tailwind CSS v4 + `lucide-react`
- **Telegram Integration:** `@telegram-apps/sdk-react`
- **Testing:** Vitest (101 unit tests, 100% pass rate)

## 3. Directory Structure & Architectural Boundaries
Respect strict separation of concerns. Do not mix 3D rendering, UI components, and game math.

```text
src/
├── game/
│   ├── config/          # SINGLE SOURCE OF TRUTH: flowers.ts, recipes.ts, npcs.ts, merchants.ts, decor.ts, balance.ts
│   ├── engine/          # Pure TypeScript functions ONLY (no React/DOM/Three): growth.ts, crafting.ts, orders.ts, merchants.ts
│   └── store/           # Zustand store (useGameStore.ts) connecting engine functions to reactive state
├── scene/               # R3F 3D components (GardenScene, TabletopDiorama, GardenPlot, BambooShop, AnimalNPC, TravelingMerchant, GardenDecor, WeatherFX)
├── ui/
│   ├── hud/             # Top frosted-glass resource bar (TopHud: coins, water, fertilizer, reputation, weather, decor, merchant)
│   ├── sheets/          # Warm cream bottom sheets (PlotSheet, ResourcesSheet, ShopSheet, MerchantSheet, DecorSheet, LeaderboardSheet, GiftModal)
│   └── minigames/       # Resource minigame overlays (BambooWellGame for water, MoleCompostGame for fertilizer)
└── telegram/            # TMA SDK wrapper (tma.ts) and client-side gift link codec (gifts.ts)
```

## 4. Current Status & Completed Milestones
For full architectural diagrams, state schemas, and technical handoff details, refer to [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

All initial feature milestones are complete and verified:
- **Step 1:** Core configs (`flowers.ts`, `recipes.ts`, `balance.ts`) & pure math engine (`growth.ts`, `crafting.ts`) with Vitest tests.
- **Step 2:** Telegram Mini App SDK wrapper (`tma.ts`) & persistent Zustand store (`useGameStore.ts`).
- **Step 3:** 3D Low-Poly diorama scene (`GardenScene`, `TabletopDiorama`, `GardenPlot`, `BambooShop`, `WeatherFX`), frosted Top HUD, and cream Plot Sheet.
- **Step 4:** Water & Fertilizer economy with interactive minigames (`BambooWellGame`, `MoleCompostGame`) and `ResourcesSheet`.
- **Step 5:** Bamboo Stall customer queue (`AnimalNPC`), order generation & validation engine (`orders.ts`), 5-slot Bouquet Bench, and Recipe Book (`ShopSheet`).
- **Step 6:** Traveling Caravan Merchants (`TravelingMerchant.tsx`, `MerchantSheet.tsx`, `merchants.ts`: Wandering Raccoon & Wise Owl with lazy timer visits).
- **Step 7:** Offline Telegram gift deep links (`gifts.ts`, `GiftModal.tsx`), interactive 3D garden decorations (`decor.ts`, `GardenDecor.tsx`, `DecorSheet.tsx`), and Hall of Fame Leaderboard (`LeaderboardSheet.tsx`).

## 5. Development & Contribution Rules for Agents
1. **Never violate architectural boundaries:** Pure math belongs in `src/game/engine/` and must have accompanying `.test.ts` suites.
2. **React 19 & Compiler purity:**
   - Do NOT call impure functions (`Date.now()`, `Math.random()`) during JSX render.
   - Do NOT set React state synchronously inside `useEffect` bodies.
   - Do NOT use array index keys in JSX lists (`react-x/no-array-index-key`).
3. **Low-Poly 3D styling:**
   - Always set `flatShading: true` on 3D materials.
   - Rotations belong on `<mesh>` tags, not geometry tags.
   - Avoid mutating Three.js scene graphs inside React render cycles.
4. **Validation:** Always ensure `npm run lint`, `npm test`, and `npm run build` pass with zero errors.
