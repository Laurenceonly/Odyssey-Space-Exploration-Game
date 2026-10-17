# Improve grass persistence, golden lighting, and rendering performance

## Changes

- Remove camera-clearance grass shrinking and fading. Keep the tall curved blades and full canopy as the player approaches.
- Bake the original blade silhouettes into a persistent distant canopy; align roots, height and color with nearby grass.
- Improve coverage across the river with more even distant placement, terrain-conforming roots and multisample alpha coverage that retains fine filtered blades.
- Keep distant coverage during landing and takeoff even without crossing a grass tile boundary.
- Give nearby and distant grass a more even golden-yellow tone: warmer palette, lifted root/shaded-side lighting and gentler brightness variation. Preserve directional depth without an added bloom pass.
- Stream ordinary walking tile refills across frames (128 placement candidates/frame), keeping unfinished tiles hidden.
- Bound Low 3D rendering to a 768 × 432 pixel budget with viewport aspect ratio preserved and native-resolution interface text.
- Optimize Balanced/Medium and High with smooth blade-detail distance tiers. Keep full nearby detail and the permanent canopy, then skip fully faded detail using reused tile geometries and actual camera position.
- Compute distant tip backlighting per vertex and retain all reusable geometry references for surface cleanup.
- Update in-game release notes, README, exploration plan, performance measurements, validation record and work log.

## Measured performance

Same riverbank view, 1920 × 1080 viewport, shadows off, 10-second stationary samples. Balanced and High resolution was unchanged for this comparison.

| Quality | Before | Optimized runs |
| --- | --- | --- |
| Balanced/Medium | 34.05 FPS | 59.91 / 60.01 FPS |
| High | 22.96 FPS | 41.49 / 48.02 FPS |

These are local browser requestAnimationFrame measurements, not guaranteed displayed-frame rates. High is still below a stable 60 FPS target. These samples do not establish walking or shadows-on performance. Earlier Low river-route measurements were 56.41 FPS west-bank standing, 54.76 crossing/walking, and 47.78 east-bank standing before the Balanced/High tier pass.

## Validation

- Ten targeted grass/render-scale tests pass, including a check that optimized High submits over one third less near-detail triangle work at the test placement.
- Production build passes; the existing large-bundle warning remains.
- Riverbank visual checks and after-optimization browser samples reported no captured page/console errors.
- All 149 regression tests pass, including the region prototype’s unit tests. This does not replace its missing end-to-end browser verification.
- Final release-note syntax and Git whitespace checks pass.

## Existing unfinished work in this working tree

The working tree also contains an earlier, paused region-connectivity prototype: eleven Earth region definitions, bidirectional walking routes, region terrain/environment generation, region-aware saves and map fog/waypoints, and map/travel integration. It shares files with this grass work. End-to-end two-way region travel has not been browser-verified, and region readiness documentation is not complete. This prototype is not claimed release-ready; review or stage it separately if the intended commit is grass-only.

No staging, commit, push or deployment performed. The creator will commit. This file is a temporary commit-message aid.
