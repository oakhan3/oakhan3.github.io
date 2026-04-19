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
npm run test:screenshots          # Run Playwright end-to-end screenshot tests
npm run test:screenshots:update   # Update screenshot baselines
npm run benchmark      # Run headed Playwright performance benchmark (prints frame timing stats)
npm run check          # Format, lint, typecheck, and test in one go
npm run clean          # Remove dist/
```

## How It Works

The site renders at GBA resolution (480x320) and scales up to fill the browser window with nearest-neighbor interpolation for a crisp pixel art look.

Scenes flow: **Boot** (press any key) → **Preload** (asset loading) → **Overworld** (explore and interact).

Uses Matter.js physics for pixel-accurate tile collisions from per-tile objectgroup polygon shapes defined in Tiled. Controls are WASD/arrows on desktop and drag-from-origin with visual joystick on mobile.

## Testing

Unit and integration tests run in a real Chromium instance via Vitest browser mode — no mocking, no jsdom. Tests assert observable behavior (player position, UI visibility) against a live Phaser game.

End-to-end screenshot tests (`npm run test:screenshots`) boot the full game and compare canvas snapshots against committed baselines. Snapshots are platform-independent: baselines committed on macOS also pass on Linux CI.

A headed Playwright benchmark (`npm run benchmark`) measures frame time and per-system update cost over a 5-second movement run. Use it before and after performance changes to quantify improvement.

## Performance

The game targets 30fps with consistent movement speed across varying frame rates. A headed Playwright benchmark with CPU throttle (`npm run benchmark`) approximates mid-range Android conditions and measures frame time and per-system cost over a sustained movement run.

Optimizations applied:

- **30fps hard cap with fixed velocity** — the game targets 30fps with `limit: 30` enforced. Player velocity is a fixed constant calibrated at 30fps.
- **Matter.js solver iterations halved** — `positionIterations: 3`, `velocityIterations: 2`, `constraintIterations: 1` (defaults are 6/4/2). Safe for a top-down RPG with no complex joints or stacking.
- **High-performance GPU hint** — `render: { powerPreference: 'high-performance' }` tells the browser to prefer the discrete GPU on dual-GPU devices.
- **Off-screen light culling** — fixed lights outside the camera viewport are skipped each frame.

## Notable Features

- **Custom lighting** — nighttime overlay. Supports three cone types (stage, lamp, headlight) and three animation modes: flicker (lamps), pulse (building windows), and color-cycle (stage spotlights). Each light has a random phase offset for organic variation.
- **Procedural lightning** — a bolt strikes at a fixed location at random intervals, built with midpoint displacement.
- **Quest system** — tracks completion of named objectives. A banner slides in on each completion. Overall completion is tracked.
- **Proximity interactables** — objects defined in Tiled trigger typewriter-style dialog when the player walks nearby. A neon pink TAP! indicator appears above interactables when the player is in range. Dialogs support inline hyperlinks that open in a new tab (Safari-safe via anchor click).
- **Custom map and collisions** — tilemap built in Tiled with per-tile convex polygon collision shapes, an above-player render layer, and separate object layers for interactables.
- **Dialog system** — typewriter effect with configurable speed, optional URL link button with expanded mobile hit area, and open/close callbacks for chaining actions.
- **Touch controls** — drag-from-origin virtual d-pad with a visual indicator.
- **Responsive design** — detects mobile vs desktop and adjusts camera zoom, UI element sizing and positioning, hit areas, and in-game hints accordingly.

## Source Layout

```
src/
  main.ts                  # Game config and entry point
  config.ts                # Global constants (tile size, depth layers, etc.)
  lib/                     # Generic, app-agnostic engine modules
    collision/             # Static Matter polygon bodies from Tiled object layers
    dialog/                # Typewriter dialog box with optional inline link
    interaction/           # Proximity-based interactable system
    mobile/                # On-screen joystick touch controls
    overlay/
      spotlight/           # Nighttime spotlight overlay (ambient + fixed lights + cones)
      LightningOverlay.ts  # Procedural lightning bolt at random intervals
      SparkleOverlay.ts    # Drifting sparkle particles
    player/                # Player sprite and controller
    quests/                # Quest tracking, completion banner, and quest overlay
  scenes/
    BootScene.ts           # Title screen
    PreloadScene.ts        # Asset loading
    overworld/             # Main game scene
      scene.ts             # Wires all systems together
      collision/           # App config for collision layers
      interaction/         # App config for interactables, dialog messages, and quests
      overlays/            # App config and factory functions for each overlay
      player/              # App config for player animations
  __tests__/               # Browser integration tests
```

`src/lib/` contains generic engine code with no knowledge of the game world. `src/scenes/overworld/` contains app-specific config and factory functions that wire lib modules to the actual map content.

## Learnings from User Testing

- **Camera centering needs to account for UI** — centering the camera on the player puts the player at the visual center of the screen, but on mobile the bottom half is occupied by the virtual joystick and dialog UI. The player ends up obscured by controls. Fix: offset the camera north so the player appears in the lower half of the playable area, keeping more of the map visible above them.

- **UI component scaling must be independent of game zoom** — increasing camera zoom to fill the screen on mobile also scales up dialog boxes, quest overlays, and other HUD elements, making them oversized and breaking layout. Fix: render all UI on a separate camera at zoom 1, and exclude UI objects from the main camera. Game world and UI scale are then controlled independently.

- **Oversizing the map prevents immersion-breaking edges** — if the map is only as large as the visible viewport, players can see the edge of the world during normal movement or when the camera is offset. Fix: extend the map beyond the expected play area (especially north) so the camera never reaches a boundary during normal play, preserving the illusion of a larger world.

- **Lighting effects add life to a static map** — a tilemap with no dynamic lighting reads as flat and lifeless regardless of art quality. Colored ambient glows, flickering lamp lights, and pulsing window lights create a sense of depth and atmosphere, making the world feel inhabited rather than decorative.

- **Links need descriptive labels to set expectations** — bare or generic link text gives players no context about where they are being sent or what they will find. Named links (e.g. "View on GitHub" rather than "here") let players make an informed choice before tapping, which is especially important on mobile where mis-taps are costly.

- **Accidental dismissal ruins curated moments** — players can tap or click reflexively and dismiss a congratulatory overlay before they have time to read it, cutting short a moment that should feel rewarding. Fix: ignore dismiss input for the first 5 seconds after the overlay appears, so the experience plays out fully before the player can close it.

- **Players need persistent access to instructions** — first-time instructions shown only at startup are forgotten as soon as gameplay begins. Players get lost and have no way to recover. Fix: expose controls and objectives at any time through the quest overlay, so players can pull up a reminder without restarting or missing anything.

- **D-pad needs visual feedback to feel responsive** — without any indication of which direction is active, the virtual joystick feels unresponsive and players are unsure if their input registered. Fix: highlight the active arrow on the d-pad graphic while the player is moving in that direction, giving immediate tactile confirmation of input.

- **Tile animations signal an active world** — static tiles feel frozen. Animating water, foliage, and other environmental tiles gives the impression that the world exists independently of the player, which is key to immersion in a top-down RPG.

## Problems I Had to Solve

- **iOS Safari blocks navigation from Phaser input events** — `window.open()` and programmatic `anchor.click()` are blocked on iOS Safari unless called directly from a native DOM gesture. Phaser's input pipeline processes touch events asynchronously enough to exceed Safari's transient activation window, so any navigation triggered from a Phaser `pointerdown` listener silently fails. Fix: replace the Phaser link button's click handler with a transparent `<a>` element overlaid on the canvas at the button's position. iOS Safari treats a tap on a real anchor as a genuine user gesture regardless of what's underneath it.

- **MULTIPLY blend can't produce vibrant colored light** — the nighttime overlay uses a MULTIPLY-blended render texture to darken the scene, with white circles drawn onto it to reveal lit areas. But drawing colored circles through MULTIPLY only produces dim, muddy tones because MULTIPLY can never make pixels brighter than the source. Fix: a second render texture with ADD blend mode sits on top. Glow lights draw white on the MULTIPLY layer (to reveal the area) and draw their full color on the ADD layer (to paint vibrant color on top). The two layers combine to produce bright, saturated glows — like the blue office windows.

- **Mobile camera zoom breaks UI element sizing** — zooming the main camera 2x on mobile also zooms dialog boxes, quest overlays, and other UI, making them oversized and misaligned. Fix: a second camera at zoom 1 renders only the UI game objects. Each UI element is added to the main camera's ignore list and rendered exclusively by the UI camera, so game world zoom and UI scale are controlled independently.

- **Mobile detection: `window.innerWidth` vs `screen.width`** — `screen.width` returns the physical screen resolution, which is misleadingly large on high-DPI mobile devices and doesn't reflect the viewport. `scene.scale.width` is even more misleading: it returns the logical game width (480), not the browser viewport at all. `window.innerWidth` is the correct signal — it reflects the actual CSS viewport width and reliably distinguishes mobile from desktop. Centralized in `isMobile()` in `config.ts` so it's never inlined.

## Ideas

- [ ] Support user resizing the browser window (resize and re-center the game)
- [ ] Add background music and interaction SFX (with mute/unmute toggle)
- [ ] PWA support (manifest + service worker for offline play and home screen install)
- [ ] Local session state (persist quest progress across page reloads)
- [ ] Automated cross-device testing (real mobile devices via BrowserStack or similar)
- [ ] Custom tileset tiles
- [ ] Implement the `???` quests
- [ ] Analytics (page views, quest completion funnel)
- [ ] User feedback (in-game form or link to submit comments/bug reports)
- [ ] Mini game (simple arcade mechanic triggered by a quest or NPC interaction)

## Credits

- D-Pad by Nurhuda Rahmadihan from <a href="https://thenounproject.com/browse/icons/term/d-pad/" target="_blank" title="D-Pad Icons">Noun Project</a> (CC BY 3.0)

## Known Issues

- **Phaser bug: MatterTileBody crashes on flipped tiles** — `convertTilemapLayer` crashes with `TypeError: Cannot read properties of null (reading 'inertia')` when a colliding tile has `flipX` or `flipY` set. Workaround applied in `scene.ts`: collision is cleared on flipped tiles before conversion. Filed as [phaserjs/phaser#7247](https://github.com/phaserjs/phaser/issues/7267).
