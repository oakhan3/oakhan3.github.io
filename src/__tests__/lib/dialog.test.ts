import { describe, it, expect, afterEach } from 'vitest'
import Phaser from 'phaser'
import { DialogBox } from '../../lib/dialog'
import { DEPTH_DIALOG } from '../../config'
import { createMinimalGame, waitForScene, delay, simulateKeyPress, simulatePointerDown } from '../testing'

class DialogTestScene extends Phaser.Scene {
  dialogBox!: DialogBox

  constructor() {
    super({ key: 'DialogTestScene' })
  }

  create() {
    this.dialogBox = new DialogBox(this)
  }
}

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
  it('is hidden before show() is called', async () => {
    game = createMinimalGame([DialogTestScene])
    const scene = (await waitForScene(game, 'DialogTestScene')) as DialogTestScene

    const container = findDialogContainer(scene)
    expect(container.visible).toBe(false)
  })

  it('becomes visible after show()', async () => {
    game = createMinimalGame([DialogTestScene])
    const scene = (await waitForScene(game, 'DialogTestScene')) as DialogTestScene

    scene.dialogBox.show('Hello world')

    const container = findDialogContainer(scene)
    expect(container.visible).toBe(true)
  })

  it('typewriter shows full text after rush key', async () => {
    game = createMinimalGame([DialogTestScene])
    const scene = (await waitForScene(game, 'DialogTestScene')) as DialogTestScene

    scene.dialogBox.show('Hello world')
    simulateKeyPress(game, ' ', 32)
    await delay(50)

    const container = findDialogContainer(scene)
    const textObject = findDialogText(container)
    expect(textObject.text).toBe('Hello world')
  })

  it('hides after second key press', async () => {
    game = createMinimalGame([DialogTestScene])
    const scene = (await waitForScene(game, 'DialogTestScene')) as DialogTestScene

    scene.dialogBox.show('Hello world')
    simulateKeyPress(game, ' ', 32)
    await delay(50)
    simulateKeyPress(game, ' ', 32)
    await delay(50)

    const container = findDialogContainer(scene)
    expect(container.visible).toBe(false)
  })

  it('indicator is hidden during typewriter and visible after completion', async () => {
    game = createMinimalGame([DialogTestScene])
    const scene = (await waitForScene(game, 'DialogTestScene')) as DialogTestScene

    scene.dialogBox.show('Hello world')

    const container = findDialogContainer(scene)
    const indicator = findIndicator(container)

    expect(indicator.visible).toBe(false)

    simulateKeyPress(game, ' ', 32)
    await delay(50)

    expect(indicator.visible).toBe(true)
  })

  it('indicator is hidden after dialog is dismissed', async () => {
    game = createMinimalGame([DialogTestScene])
    const scene = (await waitForScene(game, 'DialogTestScene')) as DialogTestScene

    scene.dialogBox.show('Hello world')
    simulateKeyPress(game, ' ', 32)
    await delay(50)
    simulateKeyPress(game, ' ', 32)
    await delay(50)

    const container = findDialogContainer(scene)
    const indicator = findIndicator(container)
    expect(indicator.visible).toBe(false)
  })

  it('enter key also advances dialog', async () => {
    game = createMinimalGame([DialogTestScene])
    const scene = (await waitForScene(game, 'DialogTestScene')) as DialogTestScene

    scene.dialogBox.show('Hello world')

    simulateKeyPress(game, 'Enter', 13)
    await delay(50)

    const container = findDialogContainer(scene)
    const textObject = findDialogText(container)
    expect(textObject.text).toBe('Hello world')

    simulateKeyPress(game, 'Enter', 13)
    await delay(50)

    expect(container.visible).toBe(false)
  })

  it('fires onClose callback when dismissed', async () => {
    game = createMinimalGame([DialogTestScene])
    const scene = (await waitForScene(game, 'DialogTestScene')) as DialogTestScene

    let closed = false
    scene.dialogBox.show('Hello world', () => {
      closed = true
    })

    simulateKeyPress(game, ' ', 32)
    await delay(50)
    simulateKeyPress(game, ' ', 32)
    await delay(50)

    expect(closed).toBe(true)
  })

  it('tap advances dialog', async () => {
    game = createMinimalGame([DialogTestScene])
    const scene = (await waitForScene(game, 'DialogTestScene')) as DialogTestScene

    scene.dialogBox.show('Hello world')

    simulatePointerDown(game, 240, 160)
    await delay(50)
    simulatePointerDown(game, 240, 160)
    await delay(50)

    const container = findDialogContainer(scene)
    expect(container.visible).toBe(false)
  })
})
