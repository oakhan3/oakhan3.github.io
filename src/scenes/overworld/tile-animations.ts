import Phaser from 'phaser'

export interface TileAnimation {
  layer: Phaser.Tilemaps.TilemapLayer
  row: number
  col: number
  frames: { gid: number; duration: number }[]
  frameIndex: number
  elapsed: number
}

export function buildTileAnimations(
  map: Phaser.Tilemaps.Tilemap,
  layers: Phaser.Tilemaps.TilemapLayer[],
): TileAnimation[] {
  // NOTE: Build a lookup of GID -> animation frames from tileset data
  const animatedTiles = new Map<number, { firstgid: number; frames: { tileid: number; duration: number }[] }>()

  for (const tileset of map.tilesets) {
    const tileData = tileset.tileData as Record<string, { animation?: { tileid: number; duration: number }[] }>
    for (const [localId, data] of Object.entries(tileData)) {
      if (data.animation) {
        const gid = tileset.firstgid + parseInt(localId, 10)
        animatedTiles.set(gid, { firstgid: tileset.firstgid, frames: data.animation })
      }
    }
  }

  const animations: TileAnimation[] = []

  for (const layer of layers) {
    layer.forEachTile((tile) => {
      const animData = animatedTiles.get(tile.index)
      if (!animData) return

      animations.push({
        layer,
        row: tile.y,
        col: tile.x,
        frames: animData.frames.map((frame) => ({
          gid: animData.firstgid + frame.tileid,
          duration: frame.duration,
        })),
        frameIndex: 0,
        elapsed: 0,
      })
    })
  }

  return animations
}

export function updateTileAnimations(animations: TileAnimation[], delta: number) {
  for (const anim of animations) {
    anim.elapsed += delta
    const currentFrame = anim.frames[anim.frameIndex]
    if (anim.elapsed >= currentFrame.duration) {
      anim.elapsed -= currentFrame.duration
      anim.frameIndex = (anim.frameIndex + 1) % anim.frames.length
      // NOTE: putTileAt swaps the visual tile but the MatterTileBody created by
      // convertTilemapLayer persists. This works because all animation frames share
      // the same collision shape (full-tile blockers) (for now!).
      anim.layer.putTileAt(anim.frames[anim.frameIndex].gid, anim.col, anim.row)
    }
  }
}
