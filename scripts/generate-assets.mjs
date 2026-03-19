/**
 * Generates placeholder tileset PNG and Tiled-format JSON map.
 * Run with: node scripts/generate-assets.mjs
 *
 * Tileset tiles (16x16 each, 8 tiles wide):
 *   0 = grass (green)
 *   1 = path (tan)
 *   2 = water (blue)
 *   3 = wall/building (dark gray)
 *   4 = tree trunk (brown)
 *   5 = tree canopy (dark green) - renders above player
 *   6 = sign post (wood brown with white top)
 *   7 = door (dark red)
 */

import { createCanvas } from 'canvas'
import { writeFileSync } from 'fs'

const TILE_SIZE = 16
const TILES_PER_ROW = 8
const TILE_COUNT = 8
const ROWS = Math.ceil(TILE_COUNT / TILES_PER_ROW)

const canvas = createCanvas(TILES_PER_ROW * TILE_SIZE, ROWS * TILE_SIZE)
const context = canvas.getContext('2d')

function drawTile(index, color, detailFn) {
  const tileX = (index % TILES_PER_ROW) * TILE_SIZE
  const tileY = Math.floor(index / TILES_PER_ROW) * TILE_SIZE
  context.fillStyle = color
  context.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE)
  if (detailFn) detailFn(tileX, tileY)
}

// 0: Grass
drawTile(0, '#4a8c5c', (tileX, tileY) => {
  context.fillStyle = '#5a9c6c'
  context.fillRect(tileX + 3, tileY + 4, 2, 2)
  context.fillRect(tileX + 10, tileY + 9, 2, 2)
  context.fillRect(tileX + 6, tileY + 13, 2, 2)
})

// 1: Path
drawTile(1, '#c4a882', (tileX, tileY) => {
  context.fillStyle = '#b89c76'
  context.fillRect(tileX + 2, tileY + 5, 2, 2)
  context.fillRect(tileX + 11, tileY + 10, 2, 2)
})

// 2: Water
drawTile(2, '#3a6ca8', (tileX, tileY) => {
  context.fillStyle = '#4a7cb8'
  context.fillRect(tileX + 2, tileY + 4, 4, 1)
  context.fillRect(tileX + 9, tileY + 10, 4, 1)
})

// 3: Wall
drawTile(3, '#4a4a5a', (tileX, tileY) => {
  context.fillStyle = '#3a3a4a'
  context.fillRect(tileX, tileY, TILE_SIZE, 1)
  context.fillRect(tileX, tileY + 8, TILE_SIZE, 1)
})

// 4: Tree trunk
drawTile(4, '#4a8c5c', (tileX, tileY) => {
  context.fillStyle = '#6b4226'
  context.fillRect(tileX + 6, tileY + 4, 4, 12)
})

// 5: Tree canopy (above-player layer)
drawTile(5, '#2d6b3f', (tileX, tileY) => {
  context.fillStyle = '#3a7c4c'
  context.fillRect(tileX + 2, tileY + 2, 12, 12)
  context.fillStyle = '#2d6b3f'
  context.fillRect(tileX + 4, tileY + 4, 8, 8)
})

// 6: Sign post
drawTile(6, '#4a8c5c', (tileX, tileY) => {
  context.fillStyle = '#6b4226'
  context.fillRect(tileX + 7, tileY + 8, 2, 8)
  context.fillStyle = '#d4a862'
  context.fillRect(tileX + 3, tileY + 4, 10, 6)
  context.fillStyle = '#fff'
  context.fillRect(tileX + 5, tileY + 6, 6, 2)
})

// 7: Door
drawTile(7, '#8b2020', (tileX, tileY) => {
  context.fillStyle = '#d4a862'
  context.fillRect(tileX + 10, tileY + 8, 2, 2)
})

writeFileSync('public/assets/tilesets/overworld.png', canvas.toBuffer('image/png'))
console.log('Generated: public/assets/tilesets/overworld.png')

// Generate Tiled-format JSON map (30x20 tiles)
const MAP_WIDTH = 30
const MAP_HEIGHT = 20

// Tile IDs in Tiled format (1-indexed, 0 = empty)
const GRASS = 1
const PATH = 2
const WATER = 3
const WALL = 4
const TREE_TRUNK = 5
const TREE_CANOPY = 6
const SIGN = 7
const DOOR = 8

function createLayer(name, width, height) {
  return new Array(width * height).fill(0)
}

function setTile(layer, x, y, tileId) {
  if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
    layer[y * MAP_WIDTH + x] = tileId
  }
}

function fillRect(layer, startX, startY, width, height, tileId) {
  for (let y = startY; y < startY + height; y++) {
    for (let x = startX; x < startX + width; x++) {
      setTile(layer, x, y, tileId)
    }
  }
}

// Ground layer - fill with grass, add paths
const ground = createLayer('Ground', MAP_WIDTH, MAP_HEIGHT)
fillRect(ground, 0, 0, MAP_WIDTH, MAP_HEIGHT, GRASS)

// Horizontal path through the middle
fillRect(ground, 3, 10, 24, 2, PATH)
// Vertical path from top area
fillRect(ground, 14, 4, 2, 8, PATH)
// Vertical path to bottom
fillRect(ground, 14, 12, 2, 5, PATH)
// Side paths
fillRect(ground, 6, 7, 2, 5, PATH)
fillRect(ground, 22, 7, 2, 5, PATH)

// Water border on the edges
fillRect(ground, 0, 0, MAP_WIDTH, 2, WATER)
fillRect(ground, 0, 18, MAP_WIDTH, 2, WATER)
fillRect(ground, 0, 0, 2, MAP_HEIGHT, WATER)
fillRect(ground, 28, 0, 2, MAP_HEIGHT, WATER)

// Buildings layer
const buildings = createLayer('Buildings', MAP_WIDTH, MAP_HEIGHT)

// House top-left (About)
fillRect(buildings, 4, 4, 5, 4, WALL)
setTile(buildings, 6, 7, DOOR)

// Workshop top-right (Projects)
fillRect(buildings, 21, 4, 5, 4, WALL)
setTile(buildings, 23, 7, DOOR)

// Library bottom-left (Blog)
fillRect(buildings, 4, 13, 5, 3, WALL)
setTile(buildings, 6, 15, DOOR)

// Post office bottom-right (Contact)
fillRect(buildings, 21, 13, 5, 3, WALL)
setTile(buildings, 23, 15, DOOR)

// Collision layer (same as buildings + water + trees)
const collisions = createLayer('Collisions', MAP_WIDTH, MAP_HEIGHT)
for (let index = 0; index < ground.length; index++) {
  if (ground[index] === WATER) collisions[index] = WALL
}
for (let index = 0; index < buildings.length; index++) {
  if (buildings[index] === WALL) collisions[index] = WALL
}

// Trees (decoration + above-player)
const decoration = createLayer('Decoration', MAP_WIDTH, MAP_HEIGHT)
const abovePlayer = createLayer('AbovePlayer', MAP_WIDTH, MAP_HEIGHT)

// Scatter trees
const treePositions = [
  [3, 3], [10, 3], [17, 3], [26, 3],
  [3, 8], [10, 8], [17, 8], [26, 8],
  [3, 16], [10, 16], [17, 16], [26, 16],
]

for (const [treeX, treeY] of treePositions) {
  setTile(decoration, treeX, treeY + 1, TREE_TRUNK)
  setTile(abovePlayer, treeX, treeY, TREE_CANOPY)
  setTile(collisions, treeX, treeY, WALL)
  setTile(collisions, treeX, treeY + 1, WALL)
}

// Signs near buildings
setTile(decoration, 8, 8, SIGN)  // About sign
setTile(decoration, 20, 8, SIGN) // Projects sign
setTile(decoration, 8, 14, SIGN) // Blog sign
setTile(decoration, 20, 14, SIGN) // Contact sign

// Interactable objects (Tiled object layer)
const interactables = [
  { id: 1, name: 'sign-welcome', type: 'object', x: 15 * TILE_SIZE, y: 9 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE },
  { id: 2, name: 'npc-about', type: 'npc', x: 6 * TILE_SIZE, y: 8 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE },
  { id: 3, name: 'sign-projects', type: 'object', x: 23 * TILE_SIZE, y: 8 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE },
  { id: 4, name: 'sign-blog', type: 'object', x: 6 * TILE_SIZE, y: 14 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE },
  { id: 5, name: 'sign-contact', type: 'object', x: 23 * TILE_SIZE, y: 14 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE },
]

const map = {
  compressionlevel: -1,
  height: MAP_HEIGHT,
  infinite: false,
  layers: [
    {
      data: ground,
      height: MAP_HEIGHT,
      id: 1,
      name: 'Ground',
      opacity: 1,
      type: 'tilelayer',
      visible: true,
      width: MAP_WIDTH,
      x: 0,
      y: 0,
    },
    {
      data: decoration,
      height: MAP_HEIGHT,
      id: 2,
      name: 'Decoration',
      opacity: 1,
      type: 'tilelayer',
      visible: true,
      width: MAP_WIDTH,
      x: 0,
      y: 0,
    },
    {
      data: buildings,
      height: MAP_HEIGHT,
      id: 3,
      name: 'Buildings',
      opacity: 1,
      type: 'tilelayer',
      visible: true,
      width: MAP_WIDTH,
      x: 0,
      y: 0,
    },
    {
      data: collisions,
      height: MAP_HEIGHT,
      id: 4,
      name: 'Collisions',
      opacity: 1,
      type: 'tilelayer',
      visible: true,
      width: MAP_WIDTH,
      x: 0,
      y: 0,
    },
    {
      data: abovePlayer,
      height: MAP_HEIGHT,
      id: 5,
      name: 'AbovePlayer',
      opacity: 1,
      type: 'tilelayer',
      visible: true,
      width: MAP_WIDTH,
      x: 0,
      y: 0,
    },
    {
      draworder: 'topdown',
      id: 6,
      name: 'Interactables',
      objects: interactables.map((object) => ({
        ...object,
        point: false,
        rotation: 0,
        visible: true,
        properties: [
          { name: 'contentKey', type: 'string', value: object.name },
        ],
      })),
      opacity: 1,
      type: 'objectgroup',
      visible: true,
      x: 0,
      y: 0,
    },
  ],
  nextlayerid: 7,
  nextobjectid: 6,
  orientation: 'orthogonal',
  renderorder: 'right-down',
  tiledversion: '1.10.2',
  tileheight: 16,
  tilesets: [
    {
      columns: TILES_PER_ROW,
      firstgid: 1,
      image: '../tilesets/overworld.png',
      imageheight: ROWS * TILE_SIZE,
      imagewidth: TILES_PER_ROW * TILE_SIZE,
      margin: 0,
      name: 'overworld',
      spacing: 0,
      tilecount: TILE_COUNT,
      tileheight: TILE_SIZE,
      tilewidth: TILE_SIZE,
    },
  ],
  tilewidth: 16,
  type: 'map',
  version: '1.10',
  width: MAP_WIDTH,
}

writeFileSync('public/assets/maps/overworld.json', JSON.stringify(map, null, 2))
console.log('Generated: public/assets/maps/overworld.json')
