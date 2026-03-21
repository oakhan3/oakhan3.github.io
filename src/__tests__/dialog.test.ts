import { describe, it, expect, afterEach } from 'vitest'
import { createGame } from '../main'
import { DEPTH_DIALOG } from '../config'
import {
  bootToOverworld,
  delay,
  dismissDialog,
  findPlayer,
  simulateKeyDown,
  simulateKeyPress,
  simulateKeyUp,
} from './testing'

function findDialogContainer(scene: Phaser.Scene): Phaser.GameObjects.Container {
  return scene.children.list.find(
    (child) => child instanceof Phaser.GameObjects.Container && child.depth === DEPTH_DIALOG,
  ) as Phaser.GameObjects.Container
}

function findDialogText(container: Phaser.GameObjects.Container): Phaser.GameObjects.Text {
  return container.list.find((child) => child instanceof Phaser.GameObjects.Text) as Phaser.GameObjects.Text
}

// NOTE: The container has two Graphics children: background and indicator. Filter to Graphics
// and take the second one (indicator).
function findIndicator(container: Phaser.GameObjects.Container): Phaser.GameObjects.Graphics {
  const graphics = container.list.filter(
    (child) => child instanceof Phaser.GameObjects.Graphics,
  ) as Phaser.GameObjects.Graphics[]
  return graphics[1]
}

let game: Phaser.Game | null = null

afterEach(() => {
  if (game) {
    game.destroy(true)
    game = null
  }
})

describe('dialog box', () => {
  it('shows dialog on overworld start', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await delay(100)

    const container = findDialogContainer(scene)
    expect(container.visible).toBe(true)
  })

  it('freezes player while dialog is open', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await delay(100)

    const player = findPlayer(scene)
    const startX = player.x
    const startY = player.y

    simulateKeyDown(game, 'd', 68)
    await delay(200)
    simulateKeyUp(game, 'd', 68)

    expect(player.x).toBe(startX)
    expect(player.y).toBe(startY)
  })

  it('space rushes typewriter then dismisses', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await delay(100)

    const container = findDialogContainer(scene)
    const textObject = findDialogText(container)

    // NOTE: First press rushes the typewriter to completion.
    simulateKeyPress(game, ' ', 32)
    await delay(50)
    expect(textObject.text).toBe("Hi, I'm Omar Ali Khan! Welcome to my page.")

    // NOTE: Second press dismisses the dialog.
    simulateKeyPress(game, ' ', 32)
    await delay(50)
    expect(container.visible).toBe(false)
  })

  it('enter key also advances dialog', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await delay(100)

    const container = findDialogContainer(scene)
    const textObject = findDialogText(container)

    simulateKeyPress(game, 'Enter', 13)
    await delay(50)
    expect(textObject.text).toBe("Hi, I'm Omar Ali Khan! Welcome to my page.")

    simulateKeyPress(game, 'Enter', 13)
    await delay(50)
    expect(container.visible).toBe(false)
  })

  it('shows blinking indicator after text completes', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await delay(100)

    const container = findDialogContainer(scene)
    const indicator = findIndicator(container)

    // NOTE: Before rushing, indicator should be hidden.
    expect(indicator.visible).toBe(false)

    // NOTE: Rush the typewriter to completion.
    simulateKeyPress(game, ' ', 32)
    await delay(50)

    expect(indicator.visible).toBe(true)
  })

  it('hides indicator after dialog is dismissed', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)

    const container = findDialogContainer(scene)
    const indicator = findIndicator(container)

    expect(indicator.visible).toBe(false)
  })

  it('unfreezes player after dialog is dismissed', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)

    const player = findPlayer(scene)
    const startX = player.x

    simulateKeyDown(game, 'd', 68)
    await delay(200)
    simulateKeyUp(game, 'd', 68)

    expect(player.x).toBeGreaterThan(startX)
  })
})
