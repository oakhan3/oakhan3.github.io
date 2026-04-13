import type { Message } from '../../lib/interaction'
import type { Quest } from '../../lib/quests'

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

const TIKTOK_URL = 'https://www.tiktok.com/@kingkiwifi'
const LINKEDIN_URL = 'https://www.linkedin.com/in/omarkhan01/'
const GITHUB_URL = 'https://github.com/oakhan3/'
const INSTAGRAM_URL = 'https://www.instagram.com/electricoaksband/'
const BLOG_URL = 'https://www.breaking-changes.blog/'

// NOTE: Dialog messages keyed by the Tiled object name. Each interactable name
// maps to the text shown in the dialog box when the player interacts with it.
export const MESSAGES: Partial<Record<InteractableName, Message>> = {
  'secret-lab': { text: "Hey! Don't go in here!" },
  'secret-lab-sign': { text: "Omar's Secret Lab" },
  kiwi: { text: 'Bakaaaw!', url: TIKTOK_URL, display_link: 'KingKiwiFi TikTok' },
  'kiwi-sign': { text: 'Find Kiwi here!', url: TIKTOK_URL, display_link: 'KingKiwiFi TikTok' },
  'beach-sign': {
    text: 'Ocean breeze feels nice, I could get lost in my thoughts here...',
    url: BLOG_URL,
    display_link: 'breaking-changes Blog',
  },
  'office-sign': { text: "Omar's Office!", url: LINKEDIN_URL, display_link: 'LinkedIn' },
  office: { text: 'Very business-ey building over here...', url: LINKEDIN_URL, display_link: 'LinkedIn' },
  car: { text: "Ooooo nice car! Wait there's no roads..." },
  'github-sign': { text: "Find Omar's latest activity here!", url: GITHUB_URL, display_link: 'GitHub' },
  'github-commit': { text: 'Look at this neat pile of commits!' },
  'github-computer': { text: "Something's cooking...", url: GITHUB_URL, display_link: 'GitHub' },
  'github-stash': { text: 'This stash is embarrassing...' },
  'stage-sign': { text: 'Tune in to the Electric OAKS!', url: INSTAGRAM_URL, display_link: 'ElectricOAKs Instagram' },
  stage: { text: 'When are they coming on???', url: INSTAGRAM_URL, display_link: 'ElectricOAKs Instagram' },
}

export const QUEST_DEFINITIONS: Quest[] = [
  { name: ['kiwi-sign'], label: "Find Kiwi's Home" },
  { name: ['kiwi'], label: 'Meet Kiwi' },
  { name: ['office-sign', 'office'], label: "Find Omar's Office" },
  { name: ['github-computer'], label: "Mess with Omar's Computer" },
  { name: ['stage-sign', 'stage'], label: 'Tune in to the Electric OAKS' },
  { name: ['car'], label: 'Check out the Car' },
  { name: ['secret-lab'], label: 'Try to enter the Secret Lab' },
  { name: ['beach-sign'], label: 'Wander onto the Beach' },
  { name: ['???'], label: '???' },
  { name: ['???'], label: '???' },
]

export const CONGRATULATORY_MESSAGE = `Thanks for stopping by!

This started as a small experiment and turned into a fun way to explore map building, try game dev with Phaser, and get more familiar with frontend ecosystems.

Hope you enjoyed it. Check back later, I might sneak in a few more updates!`
