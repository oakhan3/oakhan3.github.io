import { describe, it, expect, afterEach } from 'vitest'
import Phaser from 'phaser'
import { InteractionSystem } from '../../lib/interaction'
import { PlayerSprite } from '../../lib/player/PlayerSprite'
import { PlayerController } from '../../lib/player/PlayerController'
import { TouchControls } from '../../lib/mobile/TouchControls'
import { DialogBox } from '../../lib/dialog/DialogBox'
import { GBA_WIDTH, GBA_HEIGHT } from '../../config'
import type { PlayerController as PlayerControllerType } from '../../lib/player'
import type { DialogBox as DialogBoxType } from '../../lib/dialog'
import {
  createMinimalGame,
  waitForScene,
  delay,
  simulatePointerDown,
  simulatePointerUp,
  createStubPlayerAnimations,
  findDialogContainer,
} from '../testing'

const INTERACTABLE_X = GBA_WIDTH / 2
const INTERACTABLE_Y = GBA_HEIGHT / 2

class InteractionTestScene extends Phaser.Scene {
  interactionSystem!: InteractionSystem

  constructor() {
    super({ key: 'InteractionTestScene' })
  }

  preload() {
    this.textures.generate('player', { data: ['1'], pixelWidth: 48 })
  }

  create() {
    createStubPlayerAnimations(this)
    const player = new PlayerSprite(this, INTERACTABLE_X, INTERACTABLE_Y)
    const touchControls = new TouchControls(this)
    const controller = new PlayerController(this, player, touchControls)
    const dialog = new DialogBox(this)
    const map = {
      getObjectLayer: () => ({
        objects: [{ name: 'sign', x: INTERACTABLE_X, y: INTERACTABLE_Y }],
      }),
    } as unknown as Phaser.Tilemaps.Tilemap
    this.interactionSystem = new InteractionSystem(this, map, player, controller, dialog, {
      radius: 32,
      messages: { sign: { text: 'Hello!' } },
    })
  }

  update() {
    this.interactionSystem.update()
  }
}

let game: Phaser.Game | null = null

afterEach(() => {
  if (game) {
    game.destroy(true)
    game = null
  }
})

describe('InteractionSystem', () => {
  it('throws when the Interactables layer is missing', () => {
    const map = { getObjectLayer: () => null } as unknown as Phaser.Tilemaps.Tilemap
    const scene = {} as Phaser.Scene

    expect(
      () =>
        new InteractionSystem(
          scene,
          map,
          {} as Phaser.GameObjects.Sprite,
          {} as PlayerControllerType,
          {} as DialogBoxType,
          { radius: 24, messages: {} },
        ),
    ).toThrow("Object layer 'Interactables' not found in the tilemap.")
  })

  it('tap near interactable opens dialog', async () => {
    game = createMinimalGame([InteractionTestScene], { physics: true })
    const scene = (await waitForScene(game, 'InteractionTestScene')) as InteractionTestScene

    simulatePointerDown(game, INTERACTABLE_X, INTERACTABLE_Y)
    simulatePointerUp(game, INTERACTABLE_X, INTERACTABLE_Y)
    await delay(100)

    const container = findDialogContainer(scene)
    expect(container.visible).toBe(true)
  })

  it('drag near interactable does not open dialog', async () => {
    game = createMinimalGame([InteractionTestScene], { physics: true })
    const scene = (await waitForScene(game, 'InteractionTestScene')) as InteractionTestScene

    simulatePointerDown(game, INTERACTABLE_X, INTERACTABLE_Y)
    simulatePointerUp(game, INTERACTABLE_X + 20, INTERACTABLE_Y)
    await delay(100)

    const container = findDialogContainer(scene)
    expect(container.visible).toBe(false)
  })

  it('tap to close dialog does not re-open it', async () => {
    game = createMinimalGame([InteractionTestScene], { physics: true })
    const scene = (await waitForScene(game, 'InteractionTestScene')) as InteractionTestScene

    // NOTE: Open the dialog, then wait for the typewriter to finish before tapping
    // to close. This ensures pointerdown triggers close() not rushText(), which is
    // the scenario that previously caused the dialog to re-open on pointerup.
    simulatePointerDown(game, INTERACTABLE_X, INTERACTABLE_Y)
    simulatePointerUp(game, INTERACTABLE_X, INTERACTABLE_Y)
    await delay(300)

    const container = findDialogContainer(scene)
    simulatePointerDown(game, INTERACTABLE_X, INTERACTABLE_Y)
    simulatePointerUp(game, INTERACTABLE_X, INTERACTABLE_Y)
    await delay(100)

    expect(container.visible).toBe(false)
  })

  it('onInteract callback fires with the interactable name', async () => {
    let interactedName: string | null = null
    const scene = new (class extends Phaser.Scene {
      constructor() {
        super({ key: 'OnInteractTestScene' })
      }
      preload() {
        this.textures.generate('player', { data: ['1'], pixelWidth: 48 })
      }
      create() {
        createStubPlayerAnimations(this)
        const player = new PlayerSprite(this, INTERACTABLE_X, INTERACTABLE_Y)
        const touchControls = new TouchControls(this)
        const controller = new PlayerController(this, player, touchControls)
        const dialog = new DialogBox(this)
        const map = {
          getObjectLayer: () => ({
            objects: [{ name: 'sign', x: INTERACTABLE_X, y: INTERACTABLE_Y }],
          }),
        } as unknown as Phaser.Tilemaps.Tilemap
        const system = new InteractionSystem(this, map, player, controller, dialog, {
          radius: 32,
          messages: { sign: { text: 'Hello!' } },
          onInteract: (name) => {
            interactedName = name
          },
        })
        this.events.on('update', () => system.update())
      }
    })()

    game = createMinimalGame([scene], { physics: true })
    await waitForScene(game, 'OnInteractTestScene')

    simulatePointerDown(game, INTERACTABLE_X, INTERACTABLE_Y)
    simulatePointerUp(game, INTERACTABLE_X, INTERACTABLE_Y)
    await delay(100)

    expect(interactedName).toBe('sign')
  })

  it('tapping while dialog is open does not re-trigger interaction', async () => {
    game = createMinimalGame([InteractionTestScene], { physics: true })
    const scene = (await waitForScene(game, 'InteractionTestScene')) as InteractionTestScene

    // NOTE: Open the dialog with a first tap.
    simulatePointerDown(game, INTERACTABLE_X, INTERACTABLE_Y)
    simulatePointerUp(game, INTERACTABLE_X, INTERACTABLE_Y)
    await delay(100)

    const container = findDialogContainer(scene)
    expect(container.visible).toBe(true)

    // NOTE: Tap again while dialog is open — should not close and re-open (dialog stays open).
    simulatePointerDown(game, INTERACTABLE_X, INTERACTABLE_Y)
    simulatePointerUp(game, INTERACTABLE_X, INTERACTABLE_Y)
    await delay(100)

    expect(container.visible).toBe(true)
  })
})
