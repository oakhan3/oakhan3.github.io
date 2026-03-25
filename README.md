# oakhan3.github.io

Personal portfolio site built as a GBA-style RPG overworld using Phaser 3.

## Stack

- **Phaser 3** — 2D game engine (Matter.js physics)
- **Vite** — build tool
- **TypeScript**
- **Vitest + Playwright** — browser-mode tests

## Development

```bash
npm install
npm run dev            # Start dev server at localhost:8080
npm run build          # Type-check and build for production
npm run preview        # Preview production build locally
npm run typecheck      # Run TypeScript type checking
npm run lint           # Lint source files
npm run lint:fix       # Lint and auto-fix
npm run format         # Format source files with Prettier
npm run format:check   # Check formatting without writing
npm run test           # Run tests (browser mode via Playwright)
npm run test:coverage  # Run tests with coverage report (output: coverage/)
npm run test:watch     # Run tests in watch mode
npm run check          # Format, lint, typecheck, and test in one go
npm run clean          # Remove dist/
```

## How It Works

The site renders at GBA resolution (480x320) and scales up to fill the browser window with nearest-neighbor interpolation for a crisp pixel art look.

Scenes flow: **Boot** (press any key) → **Preload** (asset loading) → **Overworld** (explore and interact).

Uses Matter.js physics for pixel-accurate tile collisions matching Tiled objectgroup polygon shapes. Controls are WASD/arrows on desktop and drag-from-origin with visual joystick on mobile.

Nighttime lighting uses two RenderTexture layers (MULTIPLY for darkness + ADD for colored glow). Fixed light sources support configurable cone types (stage, lamp, headlight) and three animation types: flicker (lamps/headlights), pulse (building windows), and color-cycle (stage spotlights). Each light has a random phase offset so animations look organic. A procedural lightning bolt strikes at tile (39, 8) at random intervals using midpoint displacement.

## Source Layout

```
src/
  main.ts                  # Game config and entry point
  config.ts                # Global constants (tile size, depth layers, etc.)
  lib/                     # Generic, app-agnostic engine modules
    collision/             # Static Matter polygon bodies from Tiled object layers
    dialog/                # Typewriter dialog box
    interaction/           # Proximity-based interactable system
    mobile/                # On-screen joystick touch controls
    overlay/
      spotlight/           # Nighttime spotlight overlay (ambient + fixed lights + cones)
      LightningOverlay.ts  # Occasional lightning flash
      SparkleOverlay.ts    # Drifting sparkle particles
    player/                # Player sprite and controller
  scenes/
    BootScene.ts           # Title screen
    PreloadScene.ts        # Asset loading
    overworld/             # Main game scene
      scene.ts             # Wires all systems together
      collision/           # App config for collision layers
      interaction/         # App config for interactables and dialog messages
      overlays/            # App config and factory functions for each overlay
      player/              # App config for player animations
  __tests__/               # Browser integration tests
```

`src/lib/` contains generic engine code with no knowledge of the game world. `src/scenes/overworld/` contains app-specific config and factory functions that wire lib modules to the actual map content.

## Known Issues

- **Phaser bug: MatterTileBody crashes on flipped tiles** — `convertTilemapLayer` crashes with `TypeError: Cannot read properties of null (reading 'inertia')` when a colliding tile has `flipX` or `flipY` set. Workaround applied in `scene.ts`: collision is cleared on flipped tiles before conversion. Filed as [phaserjs/phaser#7247](https://github.com/phaserjs/phaser/issues/7247).
