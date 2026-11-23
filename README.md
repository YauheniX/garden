# Garden

Garden is a React 19, TypeScript, and Vite application.

## React Compiler

The React Compiler is enabled in Vite with the `babel-plugin-react-compiler` preset. Components and hooks are compiled during development and production builds.

## Validation

- `npm run lint` runs type-aware ESLint checks with React, React DOM, and React Hooks rules.
- `npm run build` runs the TypeScript project checks and creates a production build.

## Source structure

- `src/game/config/` — shared game data: flowers, recipes, and merchants.
- `src/game/engine/` — framework-independent game logic for growth, crafting, and orders.
- `src/game/store/` — Zustand state, persistence, and synchronization.
- `src/scene/` — Three.js / React Three Fiber scene, garden plots, house, NPCs, and weather.
- `src/ui/hud/` — resource HUD.
- `src/ui/sheets/` — garden, bouquet, shop, and merchant sheets.
- `src/ui/minigames/` — well and compost minigame overlays.
- `src/telegram/` — Telegram Mini Apps SDK integrations such as haptics, user data, and gift sharing.
