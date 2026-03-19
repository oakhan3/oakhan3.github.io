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
npm run clean          # Remove dist/
```

## How It Works

The site renders at 240x160 (GBA native resolution) and scales up to fill the browser window with nearest-neighbor interpolation for a crisp pixel art look.

Scenes flow: **Boot** (press any key) -> **Preload** (asset loading) -> **Overworld** (explore and interact).
