// Retro sound effects, synthesised in code (no audio files). Each effect is
// a function returning mono samples at SAMPLE_RATE. BootScene turns them into
// Web Audio buffers under these keys, and gameplay plays them with
// Audio.play(key). A real file loaded under the same key replaces the synth.
//
// The synth is deliberately simple, in the spirit of 8-bit sound chips:
// square / triangle / sine / noise voices with pitch sweeps, vibrato and
// short envelopes, plus note sequences and a mixer.

export const SAMPLE_RATE = 22050; // lo-fi on purpose

const TAU = Math.PI * 2;

// Note frequencies used below (Hz).
const N = {
  G3: 196, C4: 262, E4: 330, F4: 349, Fs4: 370, G4: 392, A4: 440,
  C5: 523, D5: 587, E5: 659, G5: 784, A5: 880, B5: 988,
  C6: 1047, E6: 1319, G6: 1568,
};

/**
 * One voice. `from`→`to` is the pitch sweep in Hz.
 * wave: 'square' | 'triangle' | 'sine' | 'noise' (noise pitch = how often it changes)
 */
function voice({
  wave = 'square',
  from = 440,
  to = from,
  dur = 0.1,
  vol = 0.3,
  duty = 0.5,
  attack = 0.004,
  release = 0.03,
  decay = false, // extra fade across the whole sound (bells, thuds)
  vib = 0, // vibrato rate (Hz)
  vibDepth = 0, // vibrato depth (fraction of pitch)
  lowpass = 0, // 0 = off, else smoothing 0..1 (higher = duller)
}) {
  const n = Math.max(1, Math.round(dur * SAMPLE_RATE));
  const out = new Float32Array(n);
  let phase = 0;
  let held = 0;
  let lastCycle = -1;
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const k = n > 1 ? i / (n - 1) : 0;
    let f = from * Math.pow(to / from, k); // exponential sweep sounds natural
    if (vib) f *= 1 + vibDepth * Math.sin(TAU * vib * t);
    phase += f / SAMPLE_RATE;
    const p = phase - Math.floor(phase);

    let s;
    switch (wave) {
      case 'triangle':
        s = 1 - 4 * Math.abs(p - 0.5);
        break;
      case 'sine':
        s = Math.sin(TAU * p);
        break;
      case 'noise': {
        const cycle = Math.floor(phase);
        if (cycle !== lastCycle) {
          held = Math.random() * 2 - 1;
          lastCycle = cycle;
        }
        s = held;
        break;
      }
      default:
        s = p < duty ? 1 : -1;
    }
    if (lowpass) {
      lp += (s - lp) * (1 - lowpass);
      s = lp;
    }

    let env = Math.min(1, t / attack) * Math.min(1, (dur - t) / release);
    if (decay) env *= (1 - k) * (1 - k);
    out[i] = s * vol * Math.max(0, env);
  }
  return out;
}

/** Notes one after another: [[freqHz or 0 for a rest, seconds], ...]. */
function seq(notes, opts = {}) {
  const parts = notes.map(([freq, dur]) =>
    freq ? voice({ ...opts, from: freq, to: freq, dur }) : new Float32Array(Math.round(dur * SAMPLE_RATE)),
  );
  const out = new Float32Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

/** Mix parts starting at given times (seconds); clipped to -1..1. */
function mix(...parts) {
  const len = Math.max(...parts.map(({ at = 0, data }) => Math.round(at * SAMPLE_RATE) + data.length));
  const out = new Float32Array(len);
  for (const { at = 0, data } of parts) {
    const o = Math.round(at * SAMPLE_RATE);
    for (let i = 0; i < data.length; i++) out[o + i] += data[i];
  }
  for (let i = 0; i < len; i++) out[i] = Math.max(-1, Math.min(1, out[i]));
  return out;
}

// --- The sound set ---------------------------------------------------------------

export const SOUNDS = {
  // Player
  jump: () => voice({ from: 280, to: 620, dur: 0.13, duty: 0.25, vol: 0.22 }),
  death: () =>
    mix(
      { data: voice({ from: 600, to: 70, dur: 0.55, vol: 0.25, vib: 12, vibDepth: 0.06 }) },
      { data: voice({ wave: 'noise', from: 3000, dur: 0.12, vol: 0.12, decay: true }) },
    ),

  // Pickups and progress
  coin: () => seq([[N.B5, 0.06], [N.E6, 0.16]], { duty: 0.5, vol: 0.2, release: 0.05 }), // a pint
  bonus: () =>
    seq(
      [[N.G5, 0.06], [N.B5, 0.06], [N.E6, 0.06], [N.G6, 0.28]],
      { duty: 0.25, vol: 0.2, vib: 9, vibDepth: 0.01, release: 0.1 },
    ), // the espresso martini
  checkpoint: () =>
    mix(
      { data: voice({ wave: 'triangle', from: N.E6, dur: 0.35, vol: 0.35, decay: true }) },
      { at: 0.16, data: voice({ wave: 'triangle', from: N.C6, dur: 0.5, vol: 0.35, decay: true }) },
    ), // "ding-dong" station bell

  // Train Conductor
  whistle: () =>
    mix(
      { data: voice({ wave: 'sine', from: 2350, to: 2450, dur: 0.5, vol: 0.18, vib: 28, vibDepth: 0.05, attack: 0.02, release: 0.08 }) },
      { data: voice({ wave: 'noise', from: 8000, dur: 0.5, vol: 0.04, attack: 0.02, release: 0.08 }) },
    ), // guard's pea whistle
  ticket: () =>
    mix(
      { data: voice({ wave: 'noise', from: 9000, dur: 0.06, vol: 0.12, decay: true }) },
      { data: voice({ from: 1800, to: 1100, dur: 0.05, duty: 0.25, vol: 0.08 }) },
    ), // a ticket flicked
  dash: () => voice({ wave: 'noise', from: 1200, to: 4000, dur: 0.35, vol: 0.18, attack: 0.08, release: 0.15, lowpass: 0.6 }),
  bounce: () => voice({ wave: 'triangle', from: 200, to: 460, dur: 0.12, vol: 0.35 }), // off his cap, harmless
  'boss-hit': () =>
    mix(
      { data: voice({ from: 190, to: 45, dur: 0.24, vol: 0.32 }) },
      { data: voice({ wave: 'noise', from: 2500, dur: 0.14, vol: 0.2, decay: true }) },
      { at: 0.02, data: voice({ from: 880, to: 1320, dur: 0.08, duty: 0.25, vol: 0.12 }) },
    ), // stomp!
  'boss-defeated': () =>
    seq(
      [[N.G4, 0.18], [N.Fs4, 0.18], [N.F4, 0.18], [N.E4, 0.6]],
      { duty: 0.5, vol: 0.2, vib: 6, vibDepth: 0.02, release: 0.08 },
    ), // comedy "wah-wah-wah-waaah"

  // Winning: a short fanfare as the lad walks into The Avocet.
  finish: () =>
    mix(
      {
        data: seq(
          [[N.C5, 0.1], [N.E5, 0.1], [N.G5, 0.1], [N.C6, 0.2], [0, 0.06], [N.G5, 0.1], [N.C6, 0.6]],
          { duty: 0.25, vol: 0.2, release: 0.04, vib: 7, vibDepth: 0.006 },
        ),
      },
      { data: seq([[N.C4, 0.3], [N.G3, 0.2], [N.C4, 0.76]], { wave: 'triangle', vol: 0.3, release: 0.06 }) },
      { at: 0.56, data: seq([[N.E5, 0.66]], { duty: 0.5, vol: 0.08, release: 0.2 }) },
    ),

  // Menus
  select: () => seq([[N.A5, 0.04], [N.E6, 0.07]], { duty: 0.25, vol: 0.15 }),
  move: () => voice({ from: N.A4, dur: 0.04, duty: 0.25, vol: 0.12 }),
  crumble: () => voice({ wave: 'noise', from: 900, to: 200, dur: 0.25, vol: 0.18, release: 0.12, lowpass: 0.5 }), // crate giving way
  squawk: () => voice({ from: 1700, to: 900, dur: 0.16, duty: 0.125, vol: 0.07, vib: 28, vibDepth: 0.06 }), // a gull starting its swoop
  boing: () => voice({ wave: 'triangle', from: 160, to: 640, dur: 0.22, vol: 0.32, vib: 18, vibDepth: 0.08 }), // off a shop awning
  bell: () => seq([[N.E6, 0.07], [N.C6, 0.07]], { duty: 0.5, vol: 0.1, release: 0.04 }), // level-crossing warning
};
