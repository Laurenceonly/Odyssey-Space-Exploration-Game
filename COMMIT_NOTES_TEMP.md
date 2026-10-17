# Improve Fernlilt scenery, exploration maps, graphics settings, and FPS layout

## Changes

- Rework Fernlilt with tall golden grass, varied meadow openings, rolling hills, distant ridges, sheltered groves, rocks, and wildflowers.
- Add a shallow winding creek with walkable banks and wading crossings, preserving the existing swimmable pond.
- Add winding meadow and stream-side paths, with soft trail edges, clear walking corridors, and matching map/minimap routes.
- Improve grass wind, directional sunlight, ground lighting, and near-to-distant grass blending. Align distant placement, height, and colors with the detailed field.
- Extend detailed grass to roughly 90 metres on High. Use lighter grass geometry and shorter detail blends on Low and Medium; retain the cheaper distant field.
- Apply saved graphics presets to grass detail as well as render resolution. Auto adapts under sustained load.
- Add a saved Shadows toggle that applies immediately.
- Allow walking, running, and jumping while the Earth map is open. Follow the player until the map is panned; recentering restores following.
- Stop movement during map coordinate editing, keep map gestures separate from camera movement, and preserve Settings pause behavior.
- Keep terrain, water, trails, and map/minimap data consistent. Preserve map fog and session-local waypoints.
- Show a centered Welcome to Earth greeting after touchdown, with normal expiry and reduced-motion support.
- Position the original plain FPS counter beside Odyssey in both space and land views.
- Hide the player name and profile icon from both headers while retaining saved-name editing in Settings.
- Fix trailing whitespace in the map code.
- Update in-game update history, the manual, README, exploration plan, roadmap, performance notes, validation record, and work log.

## Validation

- All 138 regression tests pass.
- Audio scheduling, playlist, switching, and saved-choice checks pass.
- Production build and Git whitespace checks pass.
- Browser startup and flight checks reported no page errors; Chrome emitted expected audio-autoplay notices before interaction.
- Full live-map browser verification remains incomplete after interrupted checks. Final header placement uses shared CSS; no completed final visual comparison is claimed.
- Existing large-bundle warning remains. Device-specific performance is not guaranteed.

## Scope and handoff

Only Fernlilt is built among the eleven planned Earth regions. Other regions, new activities, regional audio, and multiplayer remain deferred.

All changes remain local and uncommitted. No staging, commit, push, or deployment has been performed. The creator will commit.

This file is a temporary commit-message aid; omit it from staging if it should not be included in the repository.
