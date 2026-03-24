import Phaser from 'phaser'
import { InteractionSystem } from '../../../lib/interaction'
import { PlayerController } from '../../../lib/player'
import { DialogBox } from '../../../lib/dialog'
import { INTERACTION_CONFIG } from './config'

export function createInteractionSystem(
  scene: Phaser.Scene,
  map: Phaser.Tilemaps.Tilemap,
  player: Phaser.GameObjects.Sprite,
  playerController: PlayerController,
  dialog: DialogBox,
): InteractionSystem {
  return new InteractionSystem(scene, map, player, playerController, dialog, INTERACTION_CONFIG)
}
