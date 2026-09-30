// phenology math and color helpers. pure functions, no dom.

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
export function mix(a, b, t) {
  const A = hex(a), B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
}

// how many days later everything happens at this elevation than at the region baseline
export function elevationShift(region, elevFt) {
  const e = region.elevation;
  return Math.round((elevFt - e.baselineFt) / 1000 * e.daysPer1000Ft);
}

// a species' bloom window at the current elevation, or null for non-bloomers
export function bloomWindow(sp, shift) {
  return sp.bloom ? [sp.bloom[0] + shift, sp.bloom[1] + shift] : null;
}

// bloom curve: ramps up over six days, holds, fades over eight
export function bloomAt(sp, t, shift) {
  const w = bloomWindow(sp, shift);
  if (!w) return 0;
  return clamp(Math.min((t - w[0]) / 6, (w[1] - t) / 8, 1), 0, 1);
}

export function leafAt(sp, t, shift) {
  if (sp.leaf === 'evergreen') return 1;
  const [s, e] = sp.leaf;
  return clamp((t - (s + shift)) / (e - s), 0, 1);
}

// a short state word for the ledger, and whether the plant counts as "in bloom"
export function stateOf(sp, t, shift) {
  const w = bloomWindow(sp, shift);
  if (!w) return ['evergreen', false];
  const b = bloomAt(sp, t, shift);
  if (t < w[0]) return ['not yet', false];
  if (t > w[1]) return ['done', false];
  if (b >= .95) return ['peak', true];
  return [t - w[0] < 8 ? 'budding' : 'fading', true];
}

export function fmtDate(region, t) {
  // year is arbitrary; only month and day are shown
  return new Date(2027, region.seasonStart.month - 1, region.seasonStart.day + t)
    .toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
}

// tiny seeded rng so canopy blobs and ridgelines are stable across renders
export function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
export function hash(s) {
  let h = 2166136261;
  for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
