import Phaser from 'phaser'
import { InteractionSystem } from '../../lib/interaction'
import { PlayerController } from '../../lib/player'
import { DialogBox } from '../../lib/dialog'
import type { InteractionConfig, Message } from '../../lib/interaction'

// NOTE: Pixel radius around the player's position within which an interactable
// is considered "in range". ~1.5 tiles gives comfortable trigger distance.
const INTERACTION_RADIUS = 24

// NOTE: Dialog messages keyed by the Tiled object name. Each interactable name
// maps to the text shown in the dialog box when the player interacts with it.
const MESSAGES: Record<string, Message> = {
  'secret-lab': { text: "Hey! Don't go in here!" },
  'secret-lab-sign': { text: "Omar's Secret Lab" },
  kiwi: { text: 'Bakaaaw!' },
  'kiwi-sign': { text: 'Find Kiwi here!', url: 'https://www.tiktok.com/@kingkiwifi', display_link: 'TikTok' },
  'beach-sign': { text: 'Coming soon!' },
  'office-sign': {
    text: 'Find me at work here!',
    url: 'https://www.linkedin.com/in/omarkhan01/',
    display_link: 'LinkedIn',
  },
  office: { text: "I probably shouldn't bother him at work..." },
  car: { text: 'Ooooo nice car!' },
  'github-sign': {
    text: "Find Omar's latest activity here!",
    url: 'https://github.com/oakhan3/',
    display_link: 'GitHub',
  },
  'github-commit': { text: 'Look at this neat pile of commits!' },
  'github-computer': { text: "Something's cooking..." },
  'github-stash': { text: 'This stash is embarrassing...' },
  'stage-sign': {
    text: 'Look out for the Electric OAKS!',
    url: 'https://www.instagram.com/electricoaksband/',
    display_link: 'Instagram',
  },
  stage: { text: 'When are they coming on???' },
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
