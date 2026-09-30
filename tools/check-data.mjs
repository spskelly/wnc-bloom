// data sanity check, run in ci and locally with `npm run check`.
// catches the boring mistakes: unknown species ids, windows outside the season,
// coords off the canvas, missing colors on things that bloom.
import { region } from '../data/region-wnc.js';
import { species } from '../data/species.js';
import { arrangements } from '../data/arrangements.js';
import { bloomWindow, elevationShift } from '../js/bloom.js';

const errors = [];
const err = m => errors.push(m);
const T = region.totalDays;
const HEX = /^#[0-9a-f]{6}$/i;

for (const [id, sp] of Object.entries(species)) {
  const where = `species.${id}`;
  if (!sp.name || !sp.latin) err(`${where}: missing name or latin`);
  if (!['tree', 'shrub', 'conifer', 'bulb'].includes(sp.kind)) err(`${where}: bad kind ${sp.kind}`);
  if (!(sp.r > 0 && sp.h > 0)) err(`${where}: r and h must be positive`);
  if (!HEX.test(sp.leafColor)) err(`${where}: leafColor not a hex color`);
  if (sp.kind === 'conifer') {
    if (sp.bloom) err(`${where}: conifers must not bloom`);
  } else {
    if (!Array.isArray(sp.bloom) || sp.bloom.length !== 2) err(`${where}: bloom must be [start, end]`);
    else {
      const [s, e] = sp.bloom;
      if (!(s < e)) err(`${where}: bloom start must precede end`);
      if (s < 0 || e > T) err(`${where}: bloom window ${s}..${e} outside season 0..${T}`);
      if (e - s < 10) err(`${where}: bloom window shorter than the 6+8 day ramps, it will never reach peak`);
    }
    if (!HEX.test(sp.color) || !HEX.test(sp.dot)) err(`${where}: color and dot must be hex colors`);
    if (!(sp.wash > 0 && sp.wash <= 1)) err(`${where}: wash must be in (0, 1]`);
  }
  if (sp.leaf !== 'evergreen') {
    if (!Array.isArray(sp.leaf) || !(sp.leaf[0] < sp.leaf[1])) err(`${where}: leaf must be 'evergreen' or [start, end]`);
  }
}

const seenIds = new Set();
for (const a of arrangements) {
  const where = `arrangements.${a.id}`;
  if (seenIds.has(a.id)) err(`${where}: duplicate id`);
  seenIds.add(a.id);
  if (a.id === 'custom') err(`${where}: 'custom' is reserved for the builder`);
  if (!a.title || !a.about) err(`${where}: missing title or about`);
  (a.extras || []).forEach(x => { if (!['path', 'bed', 'window'].includes(x)) err(`${where}: unknown extra ${x}`); });
  if (!a.plants.length) err(`${where}: no plants`);
  a.plants.forEach((p, i) => {
    const [sp, u, v, s = 1, nu, nv] = p;
    const w = `${where}.plants[${i}]`;
    if (!species[sp]) err(`${w}: unknown species ${sp}`);
    [[u, 'u'], [v, 'v']].forEach(([val, n]) => { if (!(val >= 0 && val <= 1)) err(`${w}: ${n} out of 0..1`); });
    if (!(s > 0 && s <= 2)) err(`${w}: size multiplier out of range`);
    if (nu !== undefined && !(nu >= 0 && nu <= 1)) err(`${w}: narrow u out of 0..1`);
    if (nv !== undefined && !(nv >= 0 && nv <= 1)) err(`${w}: narrow v out of 0..1`);
  });
}

// elevation shift should keep at least one species visible across the slider range
for (const ft of [region.elevation.minFt, region.elevation.maxFt]) {
  const sh = elevationShift(region, ft);
  const any = Object.values(species).some(sp => { const w = bloomWindow(sp, sh); return w && w[0] < T && w[1] > 0; });
  if (!any) err(`elevation ${ft} ft shifts every window out of the season`);
}

if (errors.length) {
  console.error(`${errors.length} problem(s):`);
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
}
console.log(`ok: ${Object.keys(species).length} species, ${arrangements.length} arrangements, season ${T} days`);
