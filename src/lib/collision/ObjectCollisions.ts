import Phaser from 'phaser'
import { computeCentroid } from '../math'

export interface CollisionConfig {
  interactablesLayer: string
}

export function createObjectCollisions(scene: Phaser.Scene, map: Phaser.Tilemaps.Tilemap, config: CollisionConfig) {
  _createBodiesFromLayer(scene, map, config.interactablesLayer)
}

function _createBodiesFromLayer(scene: Phaser.Scene, map: Phaser.Tilemaps.Tilemap, layerName: string) {
  const objectLayer = map.getObjectLayer(layerName)
  if (!objectLayer) throw new Error(`Object layer '${layerName}' not found in the tilemap.`)

  for (const object of objectLayer.objects) {
    // NOTE: Tiled polygon vertices are relative to the object's (x, y).
    // Point objects without a polygon are skipped — they have no shape to collide with.
    const polygon = object.polygon as { x: number; y: number }[] | undefined
    if (!polygon || polygon.length < 3) continue

    // NOTE: Convert relative vertices to absolute world coordinates.
    const absoluteVertices = polygon.map((vertex) => ({
      x: object.x! + vertex.x,
      y: object.y! + vertex.y,
    }))

    // NOTE: Matter's fromVertices() auto-centers the body on the centroid of
    // the vertex set, so the position argument must be the centroid.
    const centroid = computeCentroid(absoluteVertices)

    // NOTE: Vertices passed to fromVertices are relative to the center position
    // internally, but we pass absolute coords and let Matter compute the offset.
    scene.matter.add.fromVertices(centroid.x, centroid.y, absoluteVertices, {
      isStatic: true,
    })
  }
}
