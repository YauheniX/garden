# AGENTS.md — PandaFloristBot (Telegram Mini App)

## 1. Project Overview
**PandaFloristBot** is a cozy 3D Low-Poly tabletop diorama game built as a Telegram Mini App.
- **Theme & Visuals:** Cute animals & pandas. The player is a Panda Florist running a bamboo-roofed flower stall on a wooden tabletop diorama (inspired by cozy low-poly games with warm flat-shaded 3D geometry and minimalist cream-colored bottom sheets + frosted-glass top HUD).
- **Core Loop:** Grow flowers on garden plots in real time (affected by weather, water, and fertilizer) → craft 3–5 flower bouquets (freeform or secret recipes) → sell to visiting animal NPCs → buy rare seeds/recipe scrolls from traveling merchants → upgrade plots/decor and gift bouquets to Telegram friends.

## 2. Tech Stack
- **Framework:** React 19 + TypeScript (`strict: true`) + Vite
- **3D Engine:** Three.js + `@react-three/fiber` (v9+) + `@react-three/drei`
- **State Management:** Zustand (with `persist` middleware for local MVP, ready for backend sync)
- **Styling & UI:** Tailwind CSS v4 + `lucide-react`
- **Telegram Integration:** `@telegram-apps/sdk-react`
- **Testing:** Vitest

## 3. Directory Structure & Architectural Boundaries
Respect strict separation of concerns. Do not mix 3D rendering, UI components, and game math.

```text
src/
├── game/
│   ├── config/          # SINGLE SOURCE OF TRUTH: flowers.ts, recipes.ts, npcs.ts, merchants.ts, balance.ts
│   ├── engine/          # Pure TypeScript functions ONLY (no React/DOM/Three): growth.ts, crafting.ts, orders.ts, weather.ts
│   └── store/           # Zustand store (useGameStore.ts) connecting engine functions to reactive state
├── scene/               # R3F 3D components (Tabletop, GardenPlot, FlowerMesh, BambooShop, AnimalNPC, WeatherFX)
├── ui/
│   ├── hud/             # Top frosted-glass resource bar (coins, water, fertilizer, weather, reputation)
│   ├── sheets/          # Warm cream bottom sheets (PlotSheet, BouquetBench, ShopSheet, MerchantSheet, RecipeBook)
│   └── minigames/       # Resource minigame overlays (BambooWell for water, MoleCompost for fertilizer)
└── telegram/            # Safe wrapper around TMA SDK (init, expand, haptic, user, shareGift, startParam)