# Architecture & Technical Handoff — PandaFloristBot

This document serves as the comprehensive architectural reference and technical handoff for developers and AI agents working on **PandaFloristBot**.

---

## 1. Architectural Philosophy & Separation of Concerns

PandaFloristBot strictly adheres to a **three-tier decoupled architecture**:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                            │
│  React 19 + R3F (3D Diorama)  │  Tailwind CSS v4 (Warm Cream Sheets)   │
│  src/scene/*                  │  src/ui/*                              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ consumes state & actions
┌───────────────────────────────────▼────────────────────────────────────┐
│                           STATE LAYER                                  │
│                 Zustand Store (useGameStore.ts)                        │
│                 Persistent Local Storage: panda-florist-save-v1        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ delegates calculation
┌───────────────────────────────────▼────────────────────────────────────┐
│                    PURE DOMAIN / ENGINE LAYER                          │
│  Config (Single Source of Truth)   │  Pure Mathematical Functions      │
│  src/game/config/*                 │  src/game/engine/* (Zero DOM/3D)  │
└────────────────────────────────────────────────────────────────────────┘
```

### Strict Architectural Boundaries
1. **`src/game/config/` (Single Source of Truth):**
   - Pure constant data definitions. No logic, no state, no imports from React, Three.js, or UI.
2. **`src/game/engine/` (Pure TypeScript Engine):**
   - Deterministic, side-effect-free mathematical functions.
   - Zero React hooks, zero DOM manipulation, zero Three.js objects.
   - Fully testable in Vitest without mocking browser or Canvas environments.
3. **`src/game/store/` (State Management):**
   - Zustand store (`useGameStore.ts`) connecting engine functions to reactive state.
   - Manages state updates, triggers TMA haptics, and persists to `localStorage`.
4. **`src/scene/` (3D Diorama Rendering):**
   - React Three Fiber (v9+) & `@react-three/drei`.
   - Low-poly tabletop aesthetic (`flatShading: true` everywhere).
   - Never mutates game store inside frame loops.
5. **`src/ui/` (HUD, Bottom Sheets & Minigames):**
   - Frosted-glass top HUD and warm cream bottom sheets (`#FBF7F0`, `rounded-t-[28px]`).
   - Accessible dialogs with backdrop blur.
6. **`src/telegram/` (Telegram Mini App Integration):**
   - Safe wrapper around `@telegram-apps/sdk-react` (`tma.ts`) with browser fallback.
   - Client-side compact gift link codec (`gifts.ts`).

---

## 2. Directory Tree

```text
src/
├── game/
│   ├── config/
│   │   ├── balance.ts          # Global economy, timers, starting resources, multipliers
│   │   ├── flowers.ts          # 6 starter/rare flowers (daisy, tulip, lavender, sunflower, rose, orchid)
│   │   ├── recipes.ts          # 6 secret bouquet recipes (3–5 flowers, 1.8x – 3.8x multipliers)
│   │   ├── npcs.ts             # 5 animal customer profiles (rabbit, bear, fox, capybara, hedgehog)
│   │   ├── merchants.ts        # Traveling merchants config (Wandering Raccoon & Wise Owl)
│   │   └── decor.ts            # 6 3D garden decorations with passive buffs
│   ├── engine/
│   │   ├── growth.ts           # Pure lazy-timer growth stages (seed -> sprout -> bud -> bloom)
│   │   ├── growth.test.ts      # Unit tests for growth calculations & weather modifiers
│   │   ├── crafting.ts         # Deterministic recipe key builder, diversity multipliers, bouquet pricing
│   │   ├── crafting.test.ts    # Unit tests for bouquet crafting & recipe matching
│   │   ├── orders.ts           # Customer order generation, tag/recipe validation, reward calculation
│   │   ├── orders.test.ts      # Unit tests for order requirements & payout math
│   │   ├── merchants.ts        # Merchant visit lifecycle, offer generation, purchase validation
│   │   └── merchants.test.ts   # Unit tests for caravan schedules & locked scroll filters
│   └── store/
│       ├── useGameStore.ts     # Core Zustand store with persistence middleware
│       └── useGameStore.test.ts# Comprehensive integration unit tests
├── scene/
│   ├── GardenScene.tsx         # Main R3F Canvas, lighting, camera controls, background fog
│   ├── TabletopDiorama.tsx     # Wooden desk surface, boundary props (candle, books, low-poly trees)
│   ├── GardenPlot.tsx          # 9 raised garden beds, dynamic soil shader, growth meshes
│   ├── BambooShop.tsx          # Low-poly flower stall, paw-print sign, animated Panda Florist
│   ├── AnimalNPC.tsx           # Queued 3D low-poly animal customers with idle bobbing & speech bubbles
│   ├── TravelingMerchant.tsx   # Low-poly Raccoon with backpack / Wise Owl on perch post
│   ├── GardenDecor.tsx         # 6 interactive 3D ornaments (Lantern, Beehive, Gnome, Fountain, Arch, Windmill)
│   └── WeatherFX.tsx           # 3D weather particle systems (Sun glow, raindrops, ground mist)
├── ui/
│   ├── hud/
│   │   └── TopHud.tsx          # Frosted-glass resource bar (Coins, Water, Fertilizer, Reputation, Weather, Decor)
│   ├── sheets/
│   │   ├── PlotSheet.tsx       # Bottom sheet for planting seeds, watering, fertilizing, harvesting
│   │   ├── ResourcesSheet.tsx  # Bottom sheet for water/fertilizer economy (minigames & instant buy)
│   │   ├── ShopSheet.tsx       # 3-tab bottom sheet: Active Orders, Bouquet Bench, Recipe Book
│   │   ├── MerchantSheet.tsx   # Caravan wares bottom sheet with departure countdown
│   │   ├── DecorSheet.tsx      # Garden decor catalog with passive buffs & placement
│   │   ├── LeaderboardSheet.tsx# Hall of Fame Top 10 rankings comparing player against animal rivals
│   │   └── GiftModal.tsx       # Animated gift-opening modal for Telegram friend gifts
│   └── minigames/
│       ├── BambooWellGame.tsx  # Dynamic timing sweet-spot minigame for water replenishment
│       └── MoleCompostGame.tsx # Fast 10-second 3x3 scrap sorting minigame for fertilizer
├── telegram/
│   ├── tma.ts                  # Safe Telegram Mini App wrapper (init, haptic, user, share)
│   ├── gifts.ts                # Compact URL-safe gift encoding/decoding (`g_<payload>`)
│   └── gifts.test.ts           # Unit tests for gift serialization & deserialization
├── App.tsx                     # Top-level application coordinator & modal state management
├── main.tsx                    # Vite entry point, calls initTelegramApp()
└── index.css                   # Tailwind CSS v4 directives & custom low-poly keyframe animations
```

---

## 3. State Schema & Lazy Timer Architecture

### State Schema (`GameState` in `src/game/store/useGameStore.ts`)
Persistence Key: `panda-florist-save-v1` (stored via `createJSONStorage` in `localStorage`).

```typescript
export interface GameState {
  coins: number;                         // Primary currency earned from selling bouquets & orders
  water: number;                         // Used to accelerate plot growth (+35% speed)
  fertilizer: number;                    // Used to guarantee rare/shiny blooms
  reputation: number;                    // Florist score governing Hall of Fame rank & customer payouts
  weather: 'sunny' | 'rainy' | 'foggy';  // Current diorama climate
  weatherUpdatedAt: number;              // Timestamp of last weather change
  plots: GardenPlotState[];              // Exactly 9 plots (first 6 unlocked, 3 locked)
  seeds: Record<FlowerId, number>;       // Inventory seed counts
  harvestedFlowers: HarvestedFlower[];   // Mature blooms stored in the florist basket
  unlockedRecipes: string[];             // Canonical keys of discovered secret recipes
  activeOrders: NpcOrder[];              // Up to 3 waiting animal customer orders
  merchantVisit: MerchantVisit | null;   // Active traveling merchant stay (null if on cooldown)
  nextMerchantAt: number;                // Timestamp when next caravan arrives
  minigameCooldowns: MinigameCooldowns;  // Cooldown timestamps for Bamboo Well & Mole Compost
  unlockedDecor: DecorId[];              // Purchased 3D garden ornaments
  receivedGifts: string[];               // Claimed Telegram start_param gift tokens (guards against double-claims)
}
```

### Lazy / Offline Timer Design
To ensure battery efficiency on mobile devices and zero performance penalties when backgrounded or offline:
1. **Plot Growth (`getPlotGrowthState`):**
   - Never ticks in the background.
   - Whenever a plot is viewed or rendered, `progress = elapsed / requiredDuration` is computed purely from `plot.plantedAt`, `plot.wateredAt`, and `weather`.
   - The 3D scene re-renders growth mesh stages without mutating Zustand state.
2. **Minigame Cooldowns:**
   - Cooldowns are stored as future timestamps (`wellReadyAt`, `compostReadyAt`).
   - The UI evaluates `Math.max(0, readyAt - now)` locally.
3. **Traveling Merchants:**
   - Evaluated lazily in `syncMerchant(now)`.
   - If `now >= merchantVisit.leavesAt`, the merchant departs and triggers cooldown (`MERCHANT_COOLDOWN_SEC = 1800`).
   - If `now >= nextMerchantAt`, a new merchant arrives with freshly generated limited stock.

---

## 4. Single Source of Truth: Config Modules

| Config File | Exported Constants / Definitions | Key Gameplay Balance |
| :--- | :--- | :--- |
| `flowers.ts` | `FLOWERS`, `FLOWER_LIST`, `FlowerDefinition` | 6 flowers: Daisy (15s), Tulip (30s), Lavender (60s), Sunflower (120s), Rose (240s), Orchid (480s). |
| `recipes.ts` | `SECRET_RECIPES`, `SECRET_RECIPES_LIST` | 6 secret combinations (3–5 flowers) providing 1.8x to 3.8x sale multipliers. |
| `npcs.ts` | `NPCS`, `NPC_LIST`, `AnimalNpcDefinition` | 5 customers (Rabbit, Bear, Fox, Capybara, Hedgehog) with preferred tags & 1.25x–1.5x coin bonuses. |
| `merchants.ts`| `MERCHANTS`, `MERCHANT_VISIT_DURATION_SEC` (900s), `MERCHANT_COOLDOWN_SEC` (1800s) | Wandering Raccoon (discounted rare seeds) & Wise Owl (secret recipe scrolls). |
| `decor.ts` | `DECORATIONS`, `DECOR_LIST`, `DecorDefinition` | 6 3D ornaments providing passive gameplay buffs & reputation boosts. |
| `balance.ts` | `STARTING_RESOURCES`, `PLOT_UNLOCK_COST` (100c), water/fertilizer prices | Weather multipliers, diversity bonuses (1.0x to 1.6x for 5 unique species), quality rolls. |

---

## 5. Pure Game Engine Functions

All functions in `src/game/engine/` are 100% deterministic:
- **`growth.ts`**:
  - `getGrowthSpeedMultiplier(isWatered, weather)`: Computes composite speed (+35% water, +15% sunny).
  - `calculateGrowthProgress(plantedAt, baseGrowthSec, isWatered, wateredAt, weather, now)`: Returns normalized progress `0..1`.
  - `getGrowthStage(progress)`: Returns `'seed' | 'sprout' | 'bud' | 'bloom'`.
  - `rollHarvestQuality({ isFertilized, weather })`: Computes quality weights (normal, rare, shiny).
- **`crafting.ts`**:
  - `buildRecipeKey(flowerIds)`: Produces deterministic, sorted canonical keys (e.g., `'daisy+daisy+tulip'`).
  - `matchRecipe(flowerIds)`: Matches against `SECRET_RECIPES`.
  - `calculateDiversityMultiplier(flowerIds)`: Grants up to 1.6x for multi-species bouquets.
  - `calculateBouquetPrice(inputs)`: Returns full breakdown with quality and recipe multipliers.
- **`orders.ts`**:
  - `generateOrder(unlockedRecipes, rng)`: Generates tag-constraint or unlocked-recipe orders.
  - `validateOrderFulfillment(order, selectedFlowers)`: Validates 3–5 flowers, tag counts, or recipe key.
  - `calculateOrderReward(order, bouquetResult)`: Computes final coin payout with NPC bonuses.
- **`merchants.ts`**:
  - `getMerchantState({ currentVisit, nextMerchantAt, now })`: Lazy-timer transitions.
  - `generateMerchantOffers(merchantId, unlockedRecipes, rng)`: Limited-stock wares (filters out unlocked recipes for Wise Owl).
  - `canBuyMerchantOffer(offer, coins)`: Validates stock and funds.

---

## 6. Client-Side & Telegram Gift Architecture

### Compact URL Encoding (`src/telegram/gifts.ts`)
Telegram deep links enforce a strict 64-character limit on `?startapp=<param>`.
To achieve peer-to-peer bouquet gifting without a database:
1. Each flower species is assigned a 1-character token:
   `daisy: 'd'`, `tulip: 't'`, `lavender: 'l'`, `sunflower: 's'`, `rose: 'r'`, `orchid: 'o'`.
2. Each quality tier is assigned a 1-character token:
   `normal: 'n'`, `rare: 'r'`, `shiny: 's'`.
3. A 3-to-5 flower bouquet is serialized into:
   `g_<f0><q0><f1><q1><f2><q2>...`
   *Example:* `g_dntrrs` (Daisy Normal + Tulip Rare + Rose Shiny).
   Length: **8 to 12 characters** (well below the 64-character ceiling).
4. When opened via `https://t.me/PandaFloristBot/garden?startapp=g_dntrrs`, the app extracts `startapp`, decodes the bouquet, awards bonus seeds and coins, and records the token in `receivedGifts` to prevent reuse.

---

## 7. Known Client-Only Assumptions & Intentional Design Choices

For agents extending this project in future steps:
1. **Local Storage Persistence:**
   - Current persistence uses `localStorage` via Zustand `persist`.
   - The state shape is intentionally clean and serializable, ready to sync with Telegram Cloud Storage (`cloudStorage`) or a remote PostgreSQL/Redis backend if multiplayer features are introduced.
2. **Simulated Hall of Fame Rivals:**
   - `ANIMAL_RIVALS` in `useGameStore.ts` provides 9 realistic rival scores so the leaderboard feels active offline.
   - When a global backend is connected, `getLeaderboard` can simply merge real global player scores.
3. **React 19 & React Compiler Compliance:**
   - Never call `Date.now()` or `Math.random()` during component render. Place them in event handlers, state initializers (`useState(() => Date.now())`), or effects.
   - Never call `setState` synchronously inside `useEffect`.
   - Never use array indices as JSX keys (`react-x/no-array-index-key`).
4. **Vite Production Base Path:**
   - `vite.config.ts` specifies `base: '/garden/'` for GitHub Pages hosting.
   - Assets in `index.html` must remain relative (`./favicon.svg`).
