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
npm run test:watch     # Run tests in watch mode
npm run check          # Format, lint, typecheck, and test in one go
npm run clean          # Remove dist/
```

## Editing the Map

The overworld map is built in [Tiled](https://www.mapeditor.org/) and exported as JSON.

### Setup

1. Install [Tiled](https://www.mapeditor.org/)
2. Open `public/assets/maps/overworld-v2.json` in Tiled

### Tilesets

All stored in `public/assets/tilesets/`, 16x16 tile size. Tileset names in the Tiled JSON match the Phaser cache keys, so `addTilesetImage()` only needs a single argument.

| File | Source |
|------|--------|
| `heliodor.png` | Project Heliodor tileset by TheDeadHeroAlistair |

All tilesets must be embedded in the map.

### Layers

Layers in order (bottom to top):

| Layer | Type | Collision |
|-------|------|-----------|
| Ground | Tile | None |
| BackBackTree | Tile | fromGroup |
| BackTree | Tile | fromGroup |
| Tile Rise | Tile | fromGroup |
| BeachFun | Tile | fromGroup |
| Tile Layer 8 | Tile | fromGroup |
| Tile Layer 7 | Tile | fromGroup |

### Exporting

File → Export As → save to `public/assets/maps/overworld-3.json`. Make sure all tilesets are embedded.

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
