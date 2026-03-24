import Phaser from 'phaser'

export interface CollisionConfig {
  collisionLayer: string
  interactablesLayer: string
}

export function createObjectCollisions(scene: Phaser.Scene, map: Phaser.Tilemaps.Tilemap, config: CollisionConfig) {
  _createBodiesFromLayer(scene, map, config.collisionLayer)
  _createBodiesFromLayer(scene, map, config.interactablesLayer)
}

function _createBodiesFromLayer(scene: Phaser.Scene, map: Phaser.Tilemaps.Tilemap, layerName: string) {
  const objectLayer = map.getObjectLayer(layerName)
  if (!objectLayer) return

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
    const centroid = _computeCentroid(absoluteVertices)

    // NOTE: Vertices passed to fromVertices are relative to the center position
    // internally, but we pass absolute coords and let Matter compute the offset.
    scene.matter.add.fromVertices(centroid.x, centroid.y, absoluteVertices, {
      isStatic: true,
    })
  }
}

function _computeCentroid(vertices: { x: number; y: number }[]): { x: number; y: number } {
  let sumX = 0
  let sumY = 0
  for (const vertex of vertices) {
    sumX += vertex.x
    sumY += vertex.y
  }
  return { x: sumX / vertices.length, y: sumY / vertices.length }
}
