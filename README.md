# wnc-bloom

Spring bloom succession planner for the mountains west of Asheville. Scrub through March to June and watch which flowering trees and shrubs are in color, compare preset arrangements, build your own garden, and shift everything by elevation.

Live: https://spskelly.github.io/wnc-bloom/

## what it does

- **date scrubber** from March 1 to June 30 with play/pause; every plant goes bare twigs -> bloom -> leaf-out, and the meadow greens up underneath
- **six preset arrangements** (one of everything, woodland edge, two-peak driveway, kitchen window triad, magnolia relay, hot bed) drawn as illustrated scenes
- **garden builder**: add counts of any species and it auto-lays them out by height
- **elevation slider** (1,500 to 6,000 ft) that shifts every bloom window by ~7 days per 1,000 ft
- **bloom ledger** sorted by peak with a mini timeline per species; tap a row or a plant to highlight every copy in the scene
- **shareable urls**: arrangement, date, elevation and custom garden all live in the hash, e.g. `#a=woodland&d=45&e=3200`
- responsive: a wide landscape scene on desktop, a taller portrait composition on phones; light and dark themes

## stack

Static files, no build step, no dependencies. ES modules loaded straight from GitHub Pages.

```
index.html          shell
css/app.css         styles, theme tokens
js/app.js           state, url hash, tabs, builder, scrubber, ledger
js/scene.js         svg scene drawing + auto-layout for the builder
js/bloom.js         phenology math and color helpers (pure)
data/region-wnc.js  season, elevation model, footnote
data/species.js     species catalog with bloom/leaf windows and colors
data/arrangements.js  preset scenes
tools/check-data.mjs  data validation (runs in ci)
```

## run locally

ES modules won't load from `file://`, so serve the folder:

```
npm run serve      # python http.server on :8080
npm run check      # validate data files
```

## deploy

GitHub Pages, deploy from branch `main`, folder `/ (root)`. `.nojekyll` is present so nothing gets mangled. The `check` workflow validates the data on every push; there is no build job.

## adding plants or arrangements

Species live in `data/species.js`. Bloom and leaf windows are day offsets from March 1 at the region's baseline elevation (2,500 ft). Colors are hex; `wash` controls how much of the canopy the flower color takes over at peak. Run `npm run check` after editing.

Arrangements live in `data/arrangements.js` as `[speciesId, u, v, size, narrowU, narrowV]` tuples, where `u` is 0..1 across the scene and `v` is 0..1 from the horizon to the front edge. Narrow overrides are optional and only used on phone widths.

## adding a region

Copy `data/region-wnc.js`, change the season, elevation model and footnote, and supply a species file with windows calibrated to that region's baseline. Wiring a region picker into `app.js` is the remaining work; the math in `bloom.js` is already region-agnostic.

## roadmap

- aspect/microclimate offset alongside elevation (north slope delays, warm south slope advances)
- warm/cold spring nudge (a global ±10 day slider)
- drag-to-place in the builder instead of auto-layout
- og image rebuilt from the scene, same pattern as dark-sky
- region picker and a second region

## accuracy

Windows are typical for 2,000 to 3,000 ft around Waynesville and are approximate. Aspect, soil, and the particular spring move things by a week or more. Sources for the plant list are in the original notes; the scene is impressionistic, not a planting plan.
