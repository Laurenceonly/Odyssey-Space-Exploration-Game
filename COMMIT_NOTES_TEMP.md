# Expand Fernlilt exploration, improve movement, and add maps and graphics settings

## Changes

- Improve astronaut walking, foot planting, turning, jump poses, rounded boots, suit detailing, and simple gloves. Increase cabin movement speed.
- Add one double-Space airborne suit boost per jump with soft smoke from backpack thrusters.
- Add head-up normal swimming, Shift front crawl, buoyancy, gliding, and wake ripples. Disable jumping and boosting while swimming.
- Share stamina between running and fast swimming, with the meter centered above camera controls: 24 seconds running, 12 seconds fast swimming, and eight-second recovery.
- Enclose pond banks and keep cameras above the water to prevent floating-water edges and views beneath the surface.
- Expand Fernlilt to a 560 m playable radius (1.12 km across, approximately 0.985 km²).
- Add greener curved grass, improved rooted wildflowers, gentler hills, distant scenery, and orange/yellow golden-hour lighting.
- Add a centered exploration map window and circular minimap with terrain, trails, exploration fog, zoom/pan, ship/player markers, and session-local waypoints.
- Add in-world waypoint direction and distance guidance. Preserve map exploration separately by game mode and migrate older map saves.
- Simplify map colors and icon controls. Use a quick fade for the final windowed map transition, with reduced-motion support.
- Keep the region name and short description at upper left. Show other surface guidance briefly at lower center.
- Add an FPS counter, cheaper grass lighting, reusable grass tiles, terrain optimizations, and cached minimap fog.
- Add saved Auto, Low (soft/vintage), Medium, and High graphics presets. Auto reduces 3D render resolution under sustained low frame rates while keeping interface text sharp.
- Use hold-R survey scanning within three metres, with reset on release, leaving range, or opening menus.
- Update the manual, README, Earth exploration plan, region-layout diagram, roadmap, and work log.

## Scope

Only Fernlilt is playable. Its pond, groves, and rises belong to Fernlilt and do not unlock other named regions.

The other ten Earth regions, new activities, region soundtracks, and space-audio changes remain planned work.

## Validation

- All 134 tests pass.
- Production build passes.
- Git whitespace checks pass.
- Browser checks cover map and minimap interactions, waypoint guidance, notification expiry, graphics controls, and the centered map layout.
- Existing production bundle-size warning remains.
- Performance varies by device; 60 FPS on the creator's live device is not confirmed.

## Local handoff

No staging, commit, push, or deployment has been performed.

Include the new untracked source, test, and documentation files when staging.

This file is a temporary copy aid. Delete it before committing if you do not want it included in the repository.
