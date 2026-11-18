import { isTouchDevice } from './device.js';

// Full screen on phones.
//
// Android browsers support the Fullscreen API, so the game asks for it on the
// player's first tap (START) and offers a button on the menu to go back in.
// iPhone Safari can't make a page full screen; there the only way to lose the
// browser bars is to open the game from the Home Screen (see
// public/manifest.webmanifest), so the menu shows a hint instead.
//
// Every request may be refused (no gesture, user setting, unsupported); the
// game carries on as it is when that happens.

const root = () => document.documentElement;

/** True when the game was opened from the Home Screen (no browser bars). */
export function isStandalone() {
  return (
    navigator.standalone === true ||
    window.matchMedia?.('(display-mode: fullscreen)').matches ||
    window.matchMedia?.('(display-mode: standalone)').matches
  );
}

/** True when this browser can make the page full screen. */
export function canFullscreen() {
  return !!(document.fullscreenEnabled && root().requestFullscreen);
}

export function isFullscreen() {
  return !!document.fullscreenElement;
}

/** Should the menu offer a way into full screen? (touch, supported, not already in it) */
export function shouldOfferFullscreen() {
  return isTouchDevice() && !isStandalone() && canFullscreen() && !isFullscreen();
}

/** Should the menu suggest adding the game to the Home Screen? (iPhone/iPad Safari) */
export function shouldSuggestHomeScreen() {
  const ua = navigator.userAgent;
  const iOS = /iPhone|iPod|iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  return iOS && isTouchDevice() && !isStandalone() && !canFullscreen();
}

/**
 * Go full screen and lock to landscape. Must be called from a tap or click
 * handler. Resolves either way; a refusal is not an error for the game.
 */
export async function enterFullscreen() {
  if (!shouldOfferFullscreen()) return false;
  try {
    await root().requestFullscreen({ navigationUI: 'hide' });
  } catch {
    return false;
  }
  try {
    await screen.orientation?.lock?.('landscape');
  } catch {
    // Not allowed on this device; the rotate overlay still covers portrait.
  }
  return true;
}

/** Calls `fn` whenever the page enters or leaves full screen. Returns an unsubscribe. */
export function onFullscreenChange(fn) {
  document.addEventListener('fullscreenchange', fn);
  return () => document.removeEventListener('fullscreenchange', fn);
}
