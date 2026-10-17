# Odyssey performance baseline

Recorded: **2026-10-11 21:27:26 Asia/Manila (UTC+8)**.

## Measurement conditions

Local Vite production preview, Chromium 154 on Windows, Intel Graphics through ANGLE/D3D11, 1440×900 viewport, device pixel ratio 1. Each scene was sampled for six seconds after settling. Analytics was stubbed locally; other game assets and code were real. No CPU or network throttling was applied.

## Loading

| Run | Navigation to loading-screen dismissal |
| --- | --- |
| Cleared browser cache | 2.565 seconds |
| Warm browser cache | 2.340 seconds |

Cold resource transfer was approximately 8.37 MB over localhost (26 resource entries). This is not a measurement of Vercel CDN compression or internet download speed. The production JavaScript bundle was 618.55 kB before gzip and 164.99 kB gzipped.

The largest observed startup main-thread tasks lasted 974 ms cold and 964 ms warm. Similar warm and cold task durations suggest scene construction/initial preparation is a useful next profiling target; the observation does not identify the responsible function.

## Frame timing

| Scene | Average callback rate | 95th-percentile interval | Largest interval | Intervals over 33.34 ms |
| --- | --- | --- | --- | --- |
| intro | 60.0 fps | 16.9 ms | 17.1 ms | 0 |
| Saturn preview | 60.0 fps | 16.9 ms | 17.0 ms | 0 |
| asteroid belt, stationary | 60.0 fps | 16.9 ms | 17.1 ms | 0 |
| asteroid belt, forward flight | 60.0 fps | 16.8 ms | 17.0 ms | 0 |

An asteroid impact was logged during the forward-flight sample. These are requestAnimationFrame callback timings, not GPU timer-query measurements or proof that every rendered frame reached the display. All samples reported a visible document.

## Next performance work

1. Profile the roughly one-second startup task before changing initialization. Identify scene generation, texture creation, and shader preparation costs separately.
2. Measure a physical phone or lower-powered machine at its actual device pixel ratio before changing debris density or render resolution.
3. Check hosted loading under realistic network conditions before choosing texture compression, deferred loading, or code splitting.

This pass establishes a baseline. It does not change visual quality or particle counts based on one desktop result. Raw measurements and test scripts are in the Git-ignored `output/playwright/` folder.


## Creator device target — October 17, 2026

The creator reports an Acer TravelMate P215-55 with an Intel Core 5 120U. Intel lists Intel Graphics for this processor: https://www.intel.com/content/www/us/en/products/sku/236796/intel-core-5-processor-120u-12m-cache-up-to-5-00-ghz/specifications.html . Exact laptop RAM configuration, GPU driver and operating power mode have not been verified. Use this reported integrated-graphics laptop as the target for grass distance and Auto rendering-quality tuning; the local browser samples in the work log are not confirmed benchmarks of this exact configuration. High uses a detailed grass range of approximately 90 m, with a cheaper matching field beyond it.


## Current graphics controls — October 17, 2026

Graphics presets now reduce geometry as well as resolution. High uses 28 near blades and four crossed canopy projections per patch, Medium 18/3, and Low 6/3; the detailed blend ends at 88/72/56 m respectively. Reused instance buffers and the cheaper distant field are retained. Auto selects Medium or Low grass detail alongside adaptive drawing-buffer scaling. A separate Shadows setting is saved and applies immediately; toggling shadows does not change grass detail. DOM interface text keeps its native resolution.

The earlier work-log samples remain measurements of those specific runs. The production build retains the existing large-chunk warning.


## Fernlilt river grass follow-up — October 17, 2026

Low now caps drawing-buffer work at a 768 × 432 pixel budget, with aspect ratio preserved and native-resolution DOM text. Near grass uses six blades per patch; three persistent crossed canopy projections preserve the original full-height silhouette. Nearby tile generation is limited to 128 placement candidates per frame during ordinary walking. The far layer uses direct multisample alpha coverage rather than a hard alpha-test cutoff, and computes tip backlighting per vertex. No camera-clearance fading or shortening is applied.

Measured in the local Chrome browser at a 1920 × 1080 viewport, DPR 1, Intel Graphics via ANGLE/D3D11, Low, Shadows off. Baseline used a 1344 × 756 buffer: 34.15 FPS standing and 35.47 FPS walking. Those baseline positions differ from the final river route and are not a controlled same-view speedup comparison.

| Final river route | Duration | Average rAF rate | p95 interval | Maximum interval |
| --- | --- | --- | --- | --- |
| West bank, x160/z0 | 10 s | 56.41 FPS | 33.2 ms | 49.8 ms |
| Crossing and walking east | 20 s | 54.76 FPS | 33.3 ms | 50.2 ms |
| East bank, x205/z0 | 8 s | 47.78 FPS | 33.5 ms | 50.2 ms |

This does **not** meet a stable 60 FPS target. These are requestAnimationFrame measurements, not GPU timing or proof of displayed frames. Device power state and other workloads were not isolated. No page errors occurred during the crossing. Raw reports and screenshots are in the ignored output/playwright folder, including grass-fps-coverage-final.json and river-bank-after.png.


## Balanced and High detail tiers — October 17, 2026

Extra close-up blades no longer use the maximum detail budget on every nearby tile. High retains 28 blades near the camera, fades its upper detail tier over 24–40 m, then fades its middle tier over 40–64 m. Balanced/Medium retains 18 near blades, with extras fading over 28–48 m. Six base blades retain the existing 88/72/56 m final detail blends. The permanent matching canopy remains present. Reused tile geometries skip only fully faded extras, using camera position, the whole tile footprint and a safety margin; height, density, golden lighting and drawing-buffer resolution remain unchanged by this optimization. The grass regression check verifies over one third less near-detail triangle work on High at the tested placement.

Same west-bank view x160/z0, 1920 × 1080 viewport, shadows off, ten seconds per quality per run:

| Quality | Buffer | Before tiers | After, run 1 | After, repeat |
| --- | --- | --- | --- | --- |
| Balanced/Medium | 1632 × 918 | 34.05 FPS | 59.91 FPS | 60.01 FPS |
| High | 1920 × 1080 | 22.96 FPS | 41.49 FPS | 48.02 FPS |

No captured page or console errors in either after run. Screenshots were reviewed for retained coverage and golden tone. These stationary rAF samples do not guarantee 60 FPS while walking, with shadows enabled, in other views, or on other devices. High remains below a stable 60 FPS target and showed variability. No benchmark ran concurrently with the regression suite. Raw reports: grass-balanced-high-before.json, grass-balanced-high-after.json and grass-balanced-high-repeat.json in output/playwright.
