import Phaser from 'phaser';
import Audio from '../systems/Audio.js';

/**
 * Keyboard focus and sound for a row of Buttons: LEFT/RIGHT move the focus,
 * ENTER/SPACE press the focused one, ESC calls `onEscape`. Every press blips.
 * Returns { focus(i) } to move the focus from code.
 */
export function setupButtonFocus(scene, buttons, { focus = 0, onEscape = null } = {}) {
  for (const b of buttons) {
    const run = b.onClick;
    b.onClick = () => {
      Audio.play('select');
      run();
    };
  }
  let current = focus;
  const refresh = () => buttons.forEach((b, i) => b.setFocused(i === current));
  const move = (d) => {
    Audio.play('move');
    current = Phaser.Math.Wrap(current + d, 0, buttons.length);
    refresh();
  };
  refresh();

  const kb = scene.input.keyboard;
  kb.on('keydown-LEFT', () => move(-1));
  kb.on('keydown-RIGHT', () => move(1));
  kb.once('keydown-ENTER', () => buttons[current].onClick());
  kb.once('keydown-SPACE', () => buttons[current].onClick());
  if (onEscape) {
    kb.once('keydown-ESC', () => {
      Audio.play('select');
      onEscape();
    });
  }
  return {
    focus(i) {
      current = i;
      refresh();
    },
  };
}
