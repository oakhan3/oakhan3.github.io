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
npm run clean          # Remove dist/
```

## Editing the Map

The overworld map is built in [Tiled](https://www.mapeditor.org/) and exported as JSON.

### Setup

1. Install [Tiled](https://www.mapeditor.org/)
2. Open `public/assets/maps/overworld.tmx`

### Tileset

The tileset is from [Tiny Realm Asset Pack](https://trislin.itch.io/pixel-lands-village) by trislin (non-commercial license). Tile size is 16x16.

### Layers

Create layers in this order (bottom to top):

| Layer | Type | Purpose |
|-------|------|---------|
| Ground | Tile | Grass, paths, water -- fill the entire map |
| Decoration | Tile | Flowers, signs, small objects |
| Buildings | Tile | Walls, roofs -- transparency shows Ground beneath |
| Collisions | Tile | Paint any tile on impassable areas (hidden in game) |
| AbovePlayer | Tile | Tree canopy, roof overhangs -- renders above the player |
| Interactables | Object | Rectangle objects where the player can interact |

### Exporting

File > Export As > save to `public/assets/maps/overworld.json`. Make sure the tileset is **embedded** (right-click tileset tab > Embed Tileset).

## How It Works

The site renders at 480x320 and scales up to fill the browser window with nearest-neighbor interpolation for a crisp pixel art look.

Scenes flow: **Boot** (press any key) -> **Preload** (asset loading) -> **Overworld** (explore and interact).
