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
