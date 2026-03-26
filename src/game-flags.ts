// NOTE: Mutable flags that control optional game features. Set before scenes
// are created — test-hooks.ts sets disableOverlays before OverworldScene runs.
export const flags = {
  disableOverlays: false,
  collectFrameTimes: false,
  collectSpotlightTimes: false,
}
