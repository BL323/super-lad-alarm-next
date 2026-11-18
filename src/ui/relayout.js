import Phaser from 'phaser';

// The game width can change while a screen is showing (rotating a phone, or
// resizing a window to a wider shape; see src/systems/Scaling.js). Static
// screens are laid out once in create(), so they simply restart when the
// width changes. `getData` supplies what the restarted screen needs to look
// the same (e.g. the highlighted card).
export function restartOnWidthChange(scene, getData = () => undefined) {
  const width = scene.scale.width;
  const onResize = (gameSize) => {
    if (gameSize.width !== width) scene.scene.restart(getData());
  };
  scene.scale.on(Phaser.Scale.Events.RESIZE, onResize);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.scale.off(Phaser.Scale.Events.RESIZE, onResize));
}
