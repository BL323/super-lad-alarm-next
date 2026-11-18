// Reads the device safe-area insets (notches, home bar) from CSS env() and
// converts the part that overlaps the canvas into game pixels.

let probe = null;

function cssInsets() {
  if (!probe) {
    probe = document.createElement('div');
    probe.style.cssText =
      'position:fixed;top:0;left:0;visibility:hidden;pointer-events:none;' +
      'padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);';
    document.body.appendChild(probe);
  }
  const cs = getComputedStyle(probe);
  return {
    top: parseFloat(cs.paddingTop) || 0,
    right: parseFloat(cs.paddingRight) || 0,
    bottom: parseFloat(cs.paddingBottom) || 0,
    left: parseFloat(cs.paddingLeft) || 0,
  };
}

/** Safe-area insets that fall inside the canvas, in game pixels. */
export function safeAreaInGame(scaleManager) {
  const b = scaleManager.canvasBounds; // CSS px, relative to the viewport
  const s = b.width / scaleManager.width || 1;
  const ins = cssInsets();
  return {
    top: Math.max(0, ins.top - b.y) / s,
    left: Math.max(0, ins.left - b.x) / s,
    right: Math.max(0, ins.right - (window.innerWidth - b.right)) / s,
    bottom: Math.max(0, ins.bottom - (window.innerHeight - b.bottom)) / s,
  };
}

/** How many CSS pixels one game pixel currently covers. */
export function cssPerGamePixel(scaleManager) {
  return scaleManager.canvasBounds.width / scaleManager.width || 1;
}
