import Phaser from 'phaser'
import { InteractionSystem } from '../../lib/interaction'
import { PlayerController } from '../../lib/player'
import { DialogBox } from '../../lib/dialog'
import type { InteractionConfig, Message } from '../../lib/interaction'
import type { Quest } from '../../lib/quests'

// NOTE: Pixel radius around the player's position within which an interactable
// is considered "in range". ~1.5 tiles gives comfortable trigger distance.
const INTERACTION_RADIUS = 24

// NOTE: Union of every named object in the Tiled Interactables layer.
// Typed as the key type for MESSAGES so typos are caught at compile time.
export type InteractableName =
  | 'secret-lab'
  | 'secret-lab-sign'
  | 'kiwi'
  | 'kiwi-sign'
  | 'beach-sign'
  | 'office-sign'
  | 'office'
  | 'car'
  | 'github-sign'
  | 'github-commit'
  | 'github-computer'
  | 'github-stash'
  | 'stage-sign'
  | 'stage'
  | '???'

// NOTE: Dialog messages keyed by the Tiled object name. Each interactable name
// maps to the text shown in the dialog box when the player interacts with it.
const MESSAGES: Partial<Record<InteractableName, Message>> = {
  'secret-lab': { text: "Hey! Don't go in here!" },
  'secret-lab-sign': { text: "Omar's Secret Lab" },
  kiwi: { text: 'Bakaaaw!' },
  'kiwi-sign': { text: 'Find Kiwi here!', url: 'https://www.tiktok.com/@kingkiwifi', display_link: 'TikTok' },
  'beach-sign': { text: 'Coming soon!' },
  'office-sign': {
    text: "Omar's Office!",
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
  'github-computer': { text: "Something's cooking...", url: 'https://github.com/oakhan3/', display_link: 'GitHub' },
  'github-stash': { text: 'This stash is embarrassing...' },
  'stage-sign': {
    text: 'Tune in to the Electric OAKS!',
    url: 'https://www.instagram.com/electricoaksband/',
    display_link: 'Instagram',
  },
  stage: { text: 'When are they coming on???' },
}

export const QUEST_DEFINITIONS: Quest[] = [
  { name: 'kiwi-sign', label: "Find Kiwi's Home" },
  { name: 'kiwi', label: 'Meet Kiwi' },
  { name: 'office-sign', label: "Find Omar's Office" },
  { name: 'github-computer', label: "Find Omar's Computer" },
  { name: 'stage-sign', label: 'Find the Electric OAKS' },
  { name: 'car', label: 'Check out the car' },
  { name: 'secret-lab', label: 'Try to enter the Secret Lab' },
  { name: '???', label: '???' },
  { name: '???', label: '???' },
]

export const CONGRATULATORY_MESSAGE = `Thanks for stopping by!

This started as a small experiment and turned into a fun way to explore map building, try game dev with Phaser, and get more familiar with frontend ecosystems.

Hope you enjoyed it. Check back later, I might sneak in a few more updates!`

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
    radius: INTERACTION_RADIUS,
    messages: MESSAGES,
    onInteract,
    onDialogClose,
  }
  return new InteractionSystem(scene, map, player, playerController, dialog, config)
}
