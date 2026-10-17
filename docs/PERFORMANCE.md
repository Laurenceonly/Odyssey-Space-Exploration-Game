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

Graphics presets now reduce geometry as well as resolution. High uses 28 near blades and four distant blades per patch, Medium 18/3, and Low 10/2; the detailed blend ends at 88/72/56 m respectively. Reused instance buffers and the cheaper distant field are retained. Auto selects Medium or Low grass detail alongside adaptive drawing-buffer scaling. A separate Shadows setting is saved and applies immediately; toggling shadows does not change grass detail. DOM interface text keeps its native resolution.

No new device benchmark was completed during the final bug review. The earlier work-log samples remain measurements of those specific runs. The latest production build retains the existing large-chunk warning (main approximately 804 kB before gzip and 231.5 kB gzip).
