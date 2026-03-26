export function computeCentroid(vertices: { x: number; y: number }[]): { x: number; y: number } {
  let sumX = 0
  let sumY = 0
  for (const vertex of vertices) {
    sumX += vertex.x
    sumY += vertex.y
  }
  return { x: sumX / vertices.length, y: sumY / vertices.length }
}
