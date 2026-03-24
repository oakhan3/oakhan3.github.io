import Phaser from 'phaser'
import { InteractionSystem } from '../../lib/interaction'
import { PlayerController } from '../../lib/player'
import { DialogBox } from '../../lib/dialog'
import type { InteractionConfig } from '../../lib/interaction'

// NOTE: Pixel radius around the player's position within which an interactable
// is considered "in range". ~1.5 tiles gives comfortable trigger distance.
const INTERACTION_RADIUS = 24

// NOTE: Dialog messages keyed by the Tiled object name. Each interactable name
// maps to the text shown in the dialog box when the player interacts with it.
const MESSAGES: Record<string, string> = {
  'secret-lab': "Hey! Don't go in here!",
  'secret-lab-sign': "Omar's Secret Lab",
  kiwi: 'Bakaaaw!',
  'kiwi-sign': 'Find Kiwi here! https://www.tiktok.com/@kingkiwifi',
  'beach-sign': 'Coming soon!',
  'office-sign': 'Find me at work here! https://www.linkedin.com/in/omarkhan01/',
  office: "I probably shouldn't bother him at work...",
  car: 'Ooooo nice car!',
  'github-sign': "Find Omar's latest activity here! https://github.com/oakhan3/",
  'github-commit': 'Look at this neat pile of commits!',
  'github-computer': "Something's cooking...",
  'github-stash': 'This stash is embarrassing...',
  'stage-sign': 'Look out for the Electric OAKS! https://www.instagram.com/electricoaksband/',
  stage: 'When are they coming on???',
}

const INTERACTION_CONFIG: InteractionConfig = {
  radius: INTERACTION_RADIUS,
  messages: MESSAGES,
}

export function createInteractionSystem(
  scene: Phaser.Scene,
  map: Phaser.Tilemaps.Tilemap,
  player: Phaser.GameObjects.Sprite,
  playerController: PlayerController,
  dialog: DialogBox,
): InteractionSystem {
  return new InteractionSystem(scene, map, player, playerController, dialog, INTERACTION_CONFIG)
}
