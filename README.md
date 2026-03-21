# oakhan3.github.io

Personal portfolio site built as a GBA-style RPG overworld using Phaser 3.

## Stack

- **Phaser 3** - 2D game engine
- **Vite** - build tool
- **TypeScript**

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

Multiple tilesets are used, all stored in `public/assets/tilesets/`:

| File | Source |
|------|--------|
| `tiny-realm.png` | [Tiny Realm Asset Pack](https://trislin.itch.io/pixel-lands-village) by trislin |
| `grass.png`, `cliff.png`, `path.png`, `water.png` | Cute Fantasy Free |
| `parrot-blue.png` | Ninja Adventure Asset Pack |
| `supercar-blue.png` | TopDown Vehicles |

Tile size is 16x16. All tilesets must be **embedded** in the map (right-click tileset tab > Embed Tileset).

### Layers

Layers in order (bottom to top):

| Layer | Type | Purpose |
|-------|------|---------|
| Ground | Tile | Grass, paths, water -- fill the entire map |
| Decorations | Tile | Flowers, signs, small objects |
| Car | Tile | Vehicle tiles |
| Kiwi | Tile | Animated parrot |
| Buildings | Tile | Walls, roofs -- transparency shows Ground beneath |
| Tree | Tile | Trees and foliage |

### Exporting

File > Export As > save to `public/assets/maps/overworld-v2.json`. Make sure all tilesets are **embedded**.

## How It Works

The site renders at 480x320 and scales up to fill the browser window with nearest-neighbor interpolation for a crisp pixel art look.

Scenes flow: **Boot** (press any key) -> **Preload** (asset loading) -> **Overworld** (explore and interact).
