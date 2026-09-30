// app wiring: state, url hash, arrangement tabs, garden builder, scrubber, ledger.
import { region } from '../data/region-wnc.js';
import { species } from '../data/species.js';
import { arrangements } from '../data/arrangements.js';
import { clamp, mix, elevationShift, bloomWindow, bloomAt, leafAt, stateOf, fmtDate } from './bloom.js';
import { buildScene, layoutCustom } from './scene.js';

const TOTAL = region.totalDays;
const $ = id => document.getElementById(id);

// ---- state --------------------------------------------------------------
// everything the url needs to reproduce the view lives here
const state = {
  arr: arrangements[0].id, // arrangement id or 'custom'
  day: 0,
  elev: region.elevation.defaultFt,
  custom: {},              // { speciesId: count } for the builder
};
let selected = null, layoutName = null, scene = { instances: [], hills: [] }, rows = {};

function store(key, val) { try { localStorage.setItem('wnc-bloom-' + key, JSON.stringify(val)); } catch (e) {} }
function load(key, fallback) { try { const v = localStorage.getItem('wnc-bloom-' + key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; } }

// url hash carries arrangement, day and elevation so a view can be shared
function readHash() {
  const h = new URLSearchParams(location.hash.slice(1));
  if (h.has('a')) state.arr = h.get('a');
  if (h.has('d')) state.day = clamp(+h.get('d') || 0, 0, TOTAL);
  if (h.has('e')) state.elev = clamp(+h.get('e') || state.elev, region.elevation.minFt, region.elevation.maxFt);
  if (h.has('g')) {
    // custom garden as comma-separated id:count pairs
    const g = {};
    h.get('g').split(',').forEach(pair => { const [id, n] = pair.split(':'); if (species[id] && +n > 0) g[id] = Math.min(+n, 12); });
    if (Object.keys(g).length) { state.custom = g; state.arr = 'custom'; }
  }
}
function writeHash() {
  const h = new URLSearchParams();
  h.set('a', state.arr); h.set('d', state.day); h.set('e', state.elev);
  if (state.arr === 'custom') {
    const g = Object.entries(state.custom).filter(([, n]) => n > 0).map(([id, n]) => `${id}:${n}`).join(',');
    if (g) h.set('g', g);
  }
  history.replaceState(null, '', '#' + h.toString());
}

function currentArrangement() {
  if (state.arr === 'custom') return layoutCustom(species, state.custom);
  return arrangements.find(a => a.id === state.arr) || arrangements[0];
}
function shift() { return elevationShift(region, state.elev); }

// ---- scene + ledger -------------------------------------------------------
const mq = window.matchMedia('(max-width: 640px)');

function rebuildScene() {
  layoutName = mq.matches ? 'narrow' : 'wide';
  scene = buildScene($('scene'), layoutName, species, currentArrangement(), select, selected);
}

function buildLedger() {
  const ledger = $('ledger');
  ledger.innerHTML = '';
  rows = {};
  const counts = {};
  currentArrangement().plants.forEach(([sp]) => counts[sp] = (counts[sp] || 0) + 1);
  const ids = Object.keys(counts).sort((a, b) => {
    const A = species[a].bloom, B = species[b].bloom;
    if (!A) return 1; if (!B) return -1;
    return (A[0] + A[1]) - (B[0] + B[1]);
  });
  const sh = shift();
  ids.forEach(id => {
    const sp = species[id], w = bloomWindow(sp, sh);
    const row = document.createElement('div');
    row.className = 'row'; row.tabIndex = 0; row.setAttribute('role', 'button');
    if (sp.note) row.title = sp.note;
    const count = counts[id] > 1 ? ` <span class="count">×${counts[id]}</span>` : '';
    const track = w
      ? `<div class="track"><div class="bar" style="left:${clamp(w[0], 0, TOTAL) / TOTAL * 100}%;width:${(clamp(w[1], 0, TOTAL) - clamp(w[0], 0, TOTAL)) / TOTAL * 100}%;background:${sp.color};border:1px solid rgba(0,0,0,.12)"></div><div class="now"></div></div>`
      : `<div class="track none"></div>`;
    row.innerHTML = `<div class="swatch"></div><div><span class="name">${sp.name}${count}</span><span class="latin">${sp.latin}</span></div><div class="state"></div>${track}`;
    row.addEventListener('click', () => select(id));
    row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(id); } });
    row.classList.toggle('selected', id === selected);
    ledger.appendChild(row);
    rows[id] = { row, swatch: row.querySelector('.swatch'), now: row.querySelector('.now'), state: row.querySelector('.state') };
  });
}

function select(id) {
  selected = selected === id ? null : id;
  scene.instances.forEach(n => n.g.classList.toggle('selected', n.sp === selected));
  Object.keys(rows).forEach(k => rows[k].row.classList.toggle('selected', k === selected));
  if (selected && rows[selected]) rows[selected].row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function render() {
  const t = state.day, sh = shift();
  $('dateText').textContent = fmtDate(region, t);
  $('elevText').textContent = `${state.elev.toLocaleString()} ft` + (sh ? ` (${sh > 0 ? '+' : ''}${sh} days)` : '');
  const season = clamp((t - sh) / 75, 0, 1);
  if (scene.hills.length) {
    scene.hills[0].setAttribute('fill', mix('#b9b58a', '#7fa463', season));
    scene.hills[1].setAttribute('fill', mix('#c4bb8c', '#8bb26a', season));
  }
  const seen = {};
  scene.instances.forEach(n => {
    const sp = species[n.sp];
    if (sp.kind === 'conifer') return;
    const b = bloomAt(sp, t, sh), l = leafAt(sp, t, sh);
    // bare grey twigs fill in with leaf color as the plant leafs out
    const base = mix('#9a8b7d', sp.leafColor, l);
    const baseOpacity = .5 + .5 * l;
    n.blobs.forEach(c => { c.setAttribute('fill', base); c.setAttribute('opacity', baseOpacity); });
    n.washes.forEach(c => c.setAttribute('opacity', b * sp.wash));
    n.dots.forEach(c => c.setAttribute('opacity', b));
    seen[n.sp] = { base, b };
  });
  let blooming = 0;
  Object.keys(rows).forEach(id => {
    const sp = species[id], r = rows[id];
    const [word, on] = stateOf(sp, t, sh);
    if (on) blooming++;
    r.swatch.style.background = seen[id]
      ? (seen[id].b > 0 ? mix(seen[id].base, sp.color, Math.max(seen[id].b, .15)) : seen[id].base)
      : sp.leafColor;
    if (r.now) r.now.style.left = (t / TOTAL * 100) + '%';
    r.state.textContent = word;
    r.state.classList.toggle('on', on);
  });
  $('bloomCount').textContent = blooming === 0 ? 'nothing in bloom' : blooming === 1 ? '1 kind in bloom' : blooming + ' kinds in bloom';
  writeHash();
}

function refresh() {
  $('about').textContent = currentArrangement().about;
  $('builder').hidden = state.arr !== 'custom';
  if (state.arr === 'custom') buildChips();
  rebuildScene();
  buildLedger();
  render();
}

// ---- tabs ---------------------------------------------------------------
function buildTabs() {
  const tabs = $('tabs');
  const entries = [...arrangements.map(a => [a.id, a.title]), ['custom', 'Your garden']];
  entries.forEach(([id, title]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'tab'; b.textContent = title; b.dataset.id = id;
    b.addEventListener('click', () => { state.arr = id; selected = null; store('arr', id); syncTabs(); refresh(); });
    tabs.appendChild(b);
  });
  syncTabs();
}
function syncTabs() {
  [...$('tabs').children].forEach(b => b.setAttribute('aria-pressed', b.dataset.id === state.arr));
}

// ---- garden builder -----------------------------------------------------
const kindLabel = { tree: 'Trees', shrub: 'Shrubs', bulb: 'Bulbs', conifer: 'Evergreen backdrop' };
function buildChips() {
  const box = $('chips');
  box.innerHTML = '';
  ['tree', 'shrub', 'bulb', 'conifer'].forEach(kind => {
    const head = document.createElement('div');
    head.className = 'chip-group'; head.textContent = kindLabel[kind];
    box.appendChild(head);
    Object.keys(species).filter(id => species[id].kind === kind).forEach(id => {
      const sp = species[id], n = state.custom[id] || 0;
      const chip = document.createElement('span');
      chip.className = 'chip' + (n ? ' on' : '');
      chip.title = sp.note || sp.latin;
      chip.innerHTML = `<span class="dot" style="background:${sp.color || sp.leafColor}"></span>${sp.name} <b>${n || ''}</b>`;
      const minus = document.createElement('button'); minus.type = 'button'; minus.textContent = '−'; minus.setAttribute('aria-label', `Remove one ${sp.name}`);
      const plus = document.createElement('button'); plus.type = 'button'; plus.textContent = '+'; plus.setAttribute('aria-label', `Add one ${sp.name}`);
      minus.addEventListener('click', () => setCount(id, n - 1));
      plus.addEventListener('click', () => setCount(id, n + 1));
      if (n) chip.appendChild(minus);
      chip.appendChild(plus);
      box.appendChild(chip);
    });
  });
  const total = Object.values(state.custom).reduce((a, b) => a + b, 0);
  $('builderCount').textContent = total ? `${total} plant${total === 1 ? '' : 's'}` : 'empty';
}
function setCount(id, n) {
  n = clamp(n, 0, 12);
  if (n) state.custom[id] = n; else delete state.custom[id];
  store('custom', state.custom);
  refresh();
}
$('builderClear').addEventListener('click', () => { state.custom = {}; store('custom', {}); refresh(); });

// ---- scrubber + elevation ---------------------------------------------
const slider = $('day');
slider.max = TOTAL;
$('ticks').innerHTML = region.monthTicks.map(t => `<span style="left:${t.day / TOTAL * 100}%">${t.label}</span>`).join('');
slider.addEventListener('input', () => { stop(); state.day = +slider.value; render(); });
slider.addEventListener('change', () => store('day', state.day));

const elev = $('elev');
elev.min = region.elevation.minFt; elev.max = region.elevation.maxFt; elev.step = region.elevation.stepFt;
elev.addEventListener('input', () => { state.elev = +elev.value; buildLedger(); render(); });
elev.addEventListener('change', () => store('elev', state.elev));

let timer = null;
const playBtn = $('play');
function stop() { if (timer) { clearInterval(timer); timer = null; playBtn.textContent = 'Play'; } }
playBtn.addEventListener('click', () => {
  if (timer) return stop();
  if (state.day >= TOTAL) state.day = 0;
  playBtn.textContent = 'Pause';
  timer = setInterval(() => {
    state.day = Math.min(state.day + 1, TOTAL);
    slider.value = state.day;
    render();
    if (state.day >= TOTAL) stop();
  }, 90);
});
$('reset').addEventListener('click', () => { stop(); state.day = 0; slider.value = 0; render(); store('day', 0); });

// ---- boot ---------------------------------------------------------------
state.arr = load('arr', state.arr);
state.day = clamp(load('day', 0), 0, TOTAL);
state.elev = clamp(load('elev', state.elev), region.elevation.minFt, region.elevation.maxFt);
state.custom = load('custom', {});
readHash(); // the url wins over stored state so shared links open the shared view
if (state.arr !== 'custom' && !arrangements.find(a => a.id === state.arr)) state.arr = arrangements[0].id;
slider.value = state.day;
elev.value = state.elev;
$('foot').textContent = region.footnote;
buildTabs();
refresh();
if (mq.addEventListener) mq.addEventListener('change', () => { rebuildScene(); render(); });
else mq.addListener(() => { rebuildScene(); render(); });
