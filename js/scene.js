// svg scene drawing. builds the landscape once per arrangement/layout and returns
// the plant parts that render() recolors as the date moves.
import { clamp, rng, hash } from './bloom.js';

export const layouts = {
  wide:   { W: 980, H: 520, horizon: 330, span: 150, scale: 1,  ridges: [[250, 45], [285, 30], [315, 15]], hills: [345, 440], frame: 16 },
  narrow: { W: 420, H: 640, horizon: 290, span: 300, scale: .8, ridges: [[195, 32], [228, 22], [258, 12]], hills: [298, 468], frame: 11 },
};

const NS = 'http://www.w3.org/2000/svg';
export const el = (tag, attrs, parent) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
};

// a wobbly ridgeline across the full width, closed down to the bottom edge
function ridgePath(L, y0, amp, seed) {
  const r = rng(seed), n = 11, step = L.W / n;
  let d = `M0 ${y0 + (r() - .5) * amp}`;
  for (let i = 1; i <= n; i++) d += ` L${Math.round(i * step)} ${Math.round(y0 + (r() - .5) * amp * 2)}`;
  return d + ` L${L.W} ${L.H} L0 ${L.H} Z`;
}
function hillPath(L, y) {
  const W = L.W;
  return `M0 ${y} C ${W * .22} ${y - 18}, ${W * .45} ${y + 14}, ${W * .65} ${y - 6} S ${W * .92} ${y - 10}, ${W} ${y} L${W} ${L.H} L0 ${L.H} Z`;
}

// draws one plant at pixel coords and returns the parts render() will recolor
function drawPlant(svg, L, species, spId, x, base, s, seed) {
  const sp = species[spId];
  const k = L.scale * s;
  const r = sp.r * k, h = sp.h * k;
  const cy = base - h;
  const g = el('g', { class: 'plant', tabindex: 0, role: 'button', 'aria-label': sp.name }, svg);
  const rand = rng(seed);
  const parts = { g, sp: spId, blobs: [], washes: [], dots: [] };

  if (sp.kind === 'conifer') {
    // three stacked tiers, no bloom layer
    el('path', { d: `M${x} ${base} L${x} ${base - h * .3}`, stroke: 'var(--trunk)', 'stroke-width': r / 5, fill: 'none' }, g);
    for (let i = 0; i < 3; i++) {
      const top = base - h + i * h * .26, bot = base - i * h * .2, hw = r * (.55 + i * .25);
      parts.blobs.push(el('path', { d: `M${x} ${top} L${x + hw} ${bot} L${x - hw} ${bot} Z`, fill: sp.leafColor, opacity: .92 + i * .04 }, g));
    }
    el('circle', { class: 'ring', cx: x, cy: base - h * .5, r: h * .55 }, g);
    const label = el('text', { class: 'plant-label', x: clamp(x, 60, L.W - 60), y: Math.max(14, base - h - 8), 'text-anchor': 'middle' }, g);
    label.textContent = sp.name;
    return parts;
  }

  if (sp.kind === 'tree') {
    el('path', { d: `M${x} ${base} L${x} ${cy + r * .25}`, stroke: 'var(--trunk)', 'stroke-width': r / 7, 'stroke-linecap': 'round', fill: 'none' }, g);
  } else if (sp.kind === 'shrub') {
    el('path', { d: `M${x - 8} ${base} L${x - 3} ${cy + 6} M${x} ${base} L${x} ${cy} M${x + 8} ${base} L${x + 4} ${cy + 6}`, stroke: 'var(--trunk)', 'stroke-width': 2, 'stroke-linecap': 'round', fill: 'none' }, g);
  }
  // bulbs are a low spread of small clumps; trees and shrubs a round cluster
  const bulb = sp.kind === 'bulb';
  const count = sp.kind === 'tree' ? 6 : bulb ? 7 : 5;
  const sx = bulb ? r * 2.4 : r * 1.3, sy = bulb ? r * .25 : r * .9, br = bulb ? [.28, .12] : [.45, .3];
  for (let i = 0; i < count; i++) {
    parts.blobs.push(el('circle', { cx: x + (rand() - .5) * sx, cy: cy + (rand() - .55) * sy, r: r * (br[0] + rand() * br[1]) }, g));
  }
  // bloom overlay: the same blobs tinted by the flower color
  parts.washes = parts.blobs.map(b => el('circle', { cx: b.getAttribute('cx'), cy: b.getAttribute('cy'), r: b.getAttribute('r'), fill: sp.color }, g));
  // flower clusters as scattered dots for texture
  const dotCount = sp.kind === 'tree' ? 16 : 11;
  for (let i = 0; i < dotCount; i++) {
    const ang = rand() * Math.PI * 2, rad = Math.sqrt(rand()) * (bulb ? r * 1.2 : r * .85);
    parts.dots.push(el('circle', { cx: x + Math.cos(ang) * rad, cy: cy - r * .1 + Math.sin(ang) * rad * (bulb ? .2 : .8), r: r * (.06 + rand() * .06), fill: sp.dot }, g));
  }
  el('circle', { class: 'ring', cx: x, cy: cy, r: bulb ? r * 1.5 : r * 1.12 }, g);
  const label = el('text', { class: 'plant-label', x: clamp(x, 60, L.W - 60), y: Math.max(14, cy - (bulb ? r * .6 : r * 1.12) - 8), 'text-anchor': 'middle' }, g);
  label.textContent = sp.name;
  return parts;
}

// builds the whole scene into container. returns { instances, hills } for render()
export function buildScene(container, layoutName, species, arrangement, onSelect, selected) {
  const L = layouts[layoutName];
  const narrow = layoutName === 'narrow';
  container.innerHTML = '';
  if (!arrangement.plants.length) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = 'Nothing planted yet. Add plants above.';
    container.appendChild(p);
    return { instances: [], hills: [] };
  }
  const svg = el('svg', { viewBox: `0 0 ${L.W} ${L.H}`, role: 'img', 'aria-label': `Illustrated garden, ${arrangement.title}` });
  container.appendChild(svg);

  const defs = el('defs', {}, svg);
  const sky = el('linearGradient', { id: 'sky', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  el('stop', { offset: '0', 'stop-color': 'var(--sky1)' }, sky);
  el('stop', { offset: '1', 'stop-color': 'var(--sky2)' }, sky);
  el('rect', { width: L.W, height: L.H, fill: 'url(#sky)' }, svg);
  L.ridges.forEach(([y0, amp], i) => el('path', { d: ridgePath(L, y0, amp, 7 + i), fill: `var(--ridge${3 - i})` }, svg));
  const hills = L.hills.map(y => el('path', { d: hillPath(L, y) }, svg));

  const extras = arrangement.extras || [];
  if (extras.includes('path')) {
    // a driveway narrowing toward the horizon
    const W = L.W, top = L.horizon + 4, bot = L.H;
    el('path', { d: `M${W * .34} ${bot} L${W * .47} ${top} L${W * .53} ${top} L${W * .66} ${bot} Z`, fill: 'var(--path)' }, svg);
  }
  if (extras.includes('bed')) {
    const y = L.horizon + L.span * .88;
    el('ellipse', { cx: L.W * .5, cy: y, rx: L.W * .46, ry: L.span * .2, fill: 'var(--mulch)', opacity: .8 }, svg);
  }

  // back to front so overlaps read as depth
  const placed = arrangement.plants.map((p, i) => {
    const [sp, u, v, s = 1, nu, nv] = p;
    const uu = narrow && nu !== undefined ? nu : u, vv = narrow && nv !== undefined ? nv : v;
    return { sp, u: uu, v: vv, s, i };
  }).sort((a, b) => a.v - b.v);

  const instances = placed.map(p => {
    const sp = species[p.sp];
    const margin = sp.r * L.scale * p.s * .6;
    const x = clamp(p.u * L.W, margin, L.W - margin);
    const base = L.horizon + p.v * L.span;
    const parts = drawPlant(svg, L, species, p.sp, x, base, p.s, hash(arrangement.id + p.sp + p.i));
    parts.g.addEventListener('click', () => onSelect(p.sp));
    parts.g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(p.sp); } });
    parts.g.classList.toggle('selected', p.sp === selected);
    return parts;
  });

  if (extras.includes('window')) {
    // you are standing at the sink: a frame with a cross mullion over the scene
    const f = L.frame, W = L.W, H = L.H;
    const g = el('g', { 'pointer-events': 'none' }, svg);
    el('rect', { x: f / 2, y: f / 2, width: W - f, height: H - f, fill: 'none', stroke: 'var(--frame)', 'stroke-width': f }, g);
    el('rect', { x: f, y: f, width: W - 2 * f, height: H - 2 * f, fill: 'none', stroke: 'var(--frame-edge)', 'stroke-width': 1 }, g);
    el('rect', { x: W / 2 - f * .4, y: 0, width: f * .8, height: H, fill: 'var(--frame)' }, g);
    el('rect', { x: 0, y: H * .42 - f * .35, width: W, height: f * .7, fill: 'var(--frame)' }, g);
  }
  return { instances, hills };
}

// auto-layout for the garden builder: rows by plant kind, evenly spread across the width.
// counts is { speciesId: n }. returns an arrangement object.
export function layoutCustom(species, counts) {
  const rows = { conifer: [], big: [], small: [], shrub: [], bulb: [] };
  for (const id in counts) {
    const sp = species[id];
    const row = sp.kind === 'tree' ? (sp.h >= 85 ? 'big' : 'small') : sp.kind;
    for (let i = 0; i < counts[id]; i++) rows[row].push(id);
  }
  const v = { conifer: [0], big: [.16, .26], small: [.5, .58], shrub: [.74, .96], bulb: [.86] };
  const plants = [];
  for (const row in rows) {
    const ids = rows[row];
    if (!ids.length) continue;
    const bands = v[row];
    // spread the row evenly across the width and alternate depth bands so
    // neighbors interleave front/back instead of shouldering each other
    const n = ids.length, s = n > 8 ? .8 : 1;
    ids.forEach((id, i) => {
      const u = (i + .5) / n;
      plants.push([id, clamp(u, .04, .96), bands[i % bands.length], s]);
    });
  }
  return { id: 'custom', title: 'Your garden', about: 'Add and remove plants above. Everything is placed automatically by height: evergreens at the back, trees in the middle, shrubs and bulbs in front.', plants };
}
