import Phaser from 'phaser'
import { UI_BACKGROUND_COLOR, UI_BORDER_COLOR } from '../config'

// NOTE: Draws the standard rounded-rect background used by compact chrome UI
// (dialog box, completion banner). Alpha is parameterized because components
// may vary it; colors are always taken from the shared UI theme.
export function createRoundedBackground(
  scene: Phaser.Scene,
  width: number,
  height: number,
  alpha: number,
): Phaser.GameObjects.Graphics {
  const background = scene.add.graphics()
  background.fillStyle(UI_BACKGROUND_COLOR, alpha)
  background.fillRoundedRect(0, 0, width, height, 4)
  background.lineStyle(2, UI_BORDER_COLOR, 1)
  background.strokeRoundedRect(0, 0, width, height, 4)
  return background
}
