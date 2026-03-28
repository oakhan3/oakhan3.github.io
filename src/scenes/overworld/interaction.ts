import Phaser from 'phaser'
import { InteractionSystem } from '../../lib/interaction'
import { PlayerController } from '../../lib/player'
import { DialogBox } from '../../lib/dialog'
import type { InteractionConfig } from '../../lib/interaction'
import { MESSAGES } from './interaction-data'

// NOTE: Pixel radius around the player's position within which an interactable
// is considered "in range". ~1.5 tiles gives comfortable trigger distance.
const INTERACTION_RADIUS_PX = 24

export function createInteractionSystem(
  scene: Phaser.Scene,
  map: Phaser.Tilemaps.Tilemap,
  player: Phaser.GameObjects.Sprite,
  playerController: PlayerController,
  dialog: DialogBox,
  onInteract?: (name: string) => void,
  onDialogClose?: (name: string) => void,
): InteractionSystem {
  const config: InteractionConfig = {
    radius: INTERACTION_RADIUS_PX,
    messages: MESSAGES,
    onInteract,
    onDialogClose,
  }
  return new InteractionSystem(scene, map, player, playerController, dialog, config)
}
