# Odyssey work log

Use this log for completed work, checks, decisions, and work still in progress. All timestamps use **Asia/Manila (UTC+08:00)**. These are recording times, not reconstructed start or completion times.

The [commit history](../CHANGELOG.md) records every commit and its changed files. Refresh it with `node scripts/update-commit-history.mjs` after making commits. Update this work log whenever a meaningful change or check is completed. Neither file updates automatically.

## 2026-10-11 20:26:17 — Session notes

- Reviewed the project history to recover the latest development context: planet visuals, collision physics, comet effects, Moon spawn safety, startup improvements, and Vercel deployment configuration.
- Added and pushed commit `e93e01c` (`Add Vercel Analytics dependency`) to GitHub `main`. It contains `package.json` and `package-lock.json` changes for `@vercel/analytics` version `^2.0.1`. This commit adds the dependency; it does not initialize analytics tracking in the app.
- Validation: the Vite production build passed before that commit was pushed. The repository was clean and synchronized with `origin/main` immediately afterward.
- Investigated the editor's “content of the file is newer” warning. The saved `src/atmosphere.js` matched the committed code when ignoring line endings. Unsaved editor buffers could not be inspected.
- Checked project source and Markdown files on disk: no unresolved merge conflict markers were found, and `git diff --check` reported no whitespace errors at the time of inspection.
- Current work in progress: `README.md` now has local documentation edits, and Git flags `src/atmosphere.js` as modified even though the inspected code matches HEAD after normalizing line endings. These changes have not been included in the Analytics commit. Existing local edits were preserved.
- Added a generated commit history, this work log, and a script to refresh the history. The first snapshot covers all 18 existing commits, from October 8 through October 11, 2026.

## Entry template

Copy this template for future updates and replace the timestamp with the current Manila date and time.

```md
## YYYY-MM-DD HH:mm:ss — Brief description

- Changed: what changed and why; include relevant files.
- Validation: checks actually run and their results, or “not run” with a reason.
- Git: commit hash and push status, or “uncommitted”.
- Follow-up: remaining work or decisions, if any.
```

## 2026-10-11 21:27:26 — Documentation, analytics, playtest, and performance

- Preserved the revised README copy and restored setup, deployment, and development-check sections; linked the commit history and work log.
- Initialized Vercel Analytics in production builds through the installed SDK. Development runs load no analytics script. The live script endpoint returned HTTP 200.
- Fixed the Field Guide extending beneath the footer in short windows; the panel now scrolls within its available space. Verified desktop, short-window, and phone-sized layouts.
- Validation: 22 regression tests, audio checks, production build, all 11 previews, Moon autopilot, photo capture, flight resume, gentle/heavy collision behavior, and scan persistence passed. Completed corrected browser runs had no page errors.
- Measured the production preview: 2.565-second cleared-cache loading, 2.340-second warm loading, and approximately 60 fps callback timing in intro, Saturn preview, stationary asteroid-belt, and forward-flight samples. Startup includes an approximately one-second main-thread task requiring targeted profiling before optimization.
- Details: [validation record](VALIDATION.md) and [performance baseline](PERFORMANCE.md). First-time guidance remains deferred as requested.

## 2026-10-11 21:31:29 — GitHub and hosted verification

- Committed and pushed `3e68224`: README review, dated development records, analytics initialization, and the Field Guide scrolling fix.
- Verified Vercel served the matching production JavaScript bundle, loaded Analytics SDK 2.0.1 successfully, and produced no page errors.
- Vercel's served analytics script filters automated/headless browsers. No page-view POST was observed; dashboard ingestion requires a normal visitor check and remains unverified. No bot-filter bypass was used.
- Refreshed the commit-history snapshot to include this implementation commit. The snapshot's own recording commit appears on the next refresh, as documented in the history.

## 2026-10-13 14:20:06 — Mobile controls and Earth surface exploration

- Added responsive touch controls and one assisted Earth landing site: preview, land, explore as a third-person astronaut, board, and take off. Earth gravity supports walking, running, and jumping; trees, rocks, a lakeside shore, and a 104-metre walkable patch define the locally generated landscape.
- Implementation: `src/main.js`, `src/style.css`, `src/earth-surface.js`, `src/earth-physics.js`, `src/touch-controls.js`, and `index.html`. README now describes phone controls, desktop surface controls, the landing flow, and surface persistence limits.
- Preserved Odyssey's existing monochrome UI, Oxanium/DM Sans typography, and globe maps. This narrow extension inherits the incumbent design; no new identity or design-token system was introduced. Touch targets use 44-pixel controls, with scenery leading the view.
- Validation reported by the implementation session: production build and `git diff --check` passed; 28 physics/regression tests passed. Browser checks passed at 1440×900, 390×844, and 844×390, covering landing, walking, jumping, boarding, takeoff, and pointer cancellation. Evidence: `output/playwright/earth-mobile/validation.log` and screenshots in that directory. No physical phone testing was performed.
- Impeccable review: “ship — listed fixes resolved.” Resolved phone telemetry overlap, desktop joystick visibility, surface Voyages visibility, and landscape Jump/Run separation.
- Limitations: Discovery requires scanning Earth first; water permits shore movement only. Refreshing during surface exploration returns to orbital flight. Photos and logs remain browser-local.
- Git: uncommitted; no deployment or commit performed. Follow-up: physical phone testing remains unverified.

## 2026-10-13 18:28:42 — Preview and landing interface refinement

- Removed the preview banner, duplicate destination name, 360° controls, and duplicate Land button. **Return to ship** now lives in the Field Guide and appears only during previews. Direct **Land on Earth** remains in Earth's Field Guide. README reflects drag/key preview controls and the direct landing flow, replacing the previous ground-preview instructions.
- Removed the Earth Lakeside clearing title box and Solar Expedition subtitle; saved pilot and ship names remain visible. Preserved the existing Odyssey design system; no design artifacts or new identity were introduced.
- Validation reported by the implementation session: production build passed after the fixes. A desktop browser screenshot confirmed no preview strip, the landing action present, the return button visible during preview, both saved names shown, and the solar subtitle absent.
- Follow-up: mobile preview visual verification is pending; no physical phone test was run.
- Git: uncommitted and not deployed.

## 2026-10-13 18:32:31 — Phone preview verification

- Browser verification passed at 390×844: the planet preview was active and **Return to ship** was visible in the Field Guide (304×44 pixels at x43, y536). Page scroll width matched the 390-pixel viewport, with no horizontal overflow; the guide's 608-pixel content scrolls within its 530-pixel panel. Screenshot: [mobile preview](../output/playwright/earth-refinement/mobile-clean-preview.png). This completes the pending mobile preview visual check recorded above.
- Saved ship and pilot names remain in the compact phone header; their text size was refined to 8 pixels.
- The automated destination selection used an element click because its panel row was outside the viewport. This was browser verification, not a physical touch test; phone hardware testing remains unverified.
- Git: uncommitted and not deployed.

## 2026-10-13 18:35:50 — Intro Field Guide visibility fix

- Removed an orphan closing tag left by preview-banner cleanup. Field Guide, footer, surface HUD, and touch controls are again children of the main game container, restoring intro and game-state visibility rules.
- Removed the accidental mobile-only CSS wrapper around base HUD/footer styles.
- Validation: production build and desktop/390px browser DOM/CSS checks passed; Field Guide has hidden visibility and zero opacity in intro at both sizes. Checked container parentage for surface and touch controls. This focused check blocked game assets and did not repeat full gameplay checks.
- Git: uncommitted and not deployed.

## 2026-10-13 18:49:34 — Field Guide reopening and reliable autopilot arrival

- Added a Field Guide reopen button and restored F toggling in planet previews; closing the panel no longer traps the preview. Kept guide content from shrinking inside scrollable panels.
- Autopilot keeps its destination through movement inputs, destination browsing, asteroid impacts, blocked routes, and moving-body contacts. Cancel flight/P remain explicit cancellation. Expired waypoints are recalculated, steep approaches make progress independently of visual ship heading, and arrival restores the matching destination guide.
- Added a progress watchdog: stalled journeys, repeated contacts, or the travel deadline finish with a brief fade to a tested safe arrival position. The maximum deadline is 240 active flight seconds; paused overlays and suspended browser time do not count.
- Validation: 30 existing regression tests passed. Deterministic browser simulation exercised real main.js navigation with moving planets/comet: all ten autopilot destinations arrived; tested a vertical Earth approach, repeated-contact recovery, browsing/input persistence, explicit cancellation, intro guide visibility, desktop and 390px guide reopening, and no phone-width horizontal overflow. Rendering startup was bypassed in this test harness; no physical phone test was run. Evidence: output/playwright/guide-autopilot/validation.log. Separate checks confirmed the 240-second deadline fires even with continuous progress and paused time does not advance it. Production build and git diff --check passed.
- Git: uncommitted and not deployed.

## 2026-10-13 19:01:05 — Immediate intro music controls and Earth panel visibility

- Added a music control visible during intro/loading, with actual playback state rather than a misleading enabled preference. Audio starts on a permitted click/tap; unlock listeners persist until playback succeeds and retry interrupted playback. Explicit saved mute remains respected. Music volume changes update the audio bus immediately even before the game render loop.
- Restored the surface-mode rule hiding flight panels, Field Guide reopen controls, and flight HUD during Earth descent, walking, and departure. The rule had been lost when the preview banner selectors were removed.
- Validation: audio scheduling/playlist/saved-setting checks passed with immediate-volume/playback-state assertions. Browser checks on desktop and touch phone viewport enforced user-activation autoplay: intro control visible during loading, trusted click/tap changed AudioContext from suspended to running, nonzero output signal measured, mute/unmute and zero-volume re-enable passed. Real Earth landing initialization hid the guide and other flight panels and set the guide inert. Evidence: output/playwright/music-surface/validation.log. Rendering startup was bypassed by the harness; no physical-device listening test was performed.
- Git: uncommitted and not deployed.

## 2026-10-13 19:14:43 — Intro highlights and update history

- Added a compact What’s new highlight below the intro launch controls and an Update history dialog. Four dated groups summarize current gameplay additions from October 8–13 using repository history and session records. No release/version numbers or deployment claims were invented.
- Notes live in src/game-updates.js, newest first; the latest record drives the intro summary. The dialog scrolls, keeps its close control reachable, traps keyboard focus, closes with Escape/button/backdrop, and restores focus to its opener. Preserved the existing monochrome palette and typography.
- Validation: real-scene browser checks passed at 1440×900, 390×844 touch, and 844×390 touch landscape, with no page errors or horizontal overflow. Reviewed screenshots for intro and history; latest summary, four groups, dialog focus, Escape/button closing, and scrolling passed. Evidence: output/playwright/intro-updates/validation.log. No physical phone test performed.
- Git: uncommitted and not deployed.

## 2026-10-13 19:27:07 — Landing supports, approach clearance, and pilot-only identity

- Added compact three-point landing gear beneath the nose and wing roots. Jointed struts and small footpads deploy during descent, compress slightly at touchdown, keep the hull above the grass, and retract after lift-off. Reduced motion skips deployment/compression animation.
- Earth landing now requires actual manual approach or completed autopilot parking near Earth. Opening a planet preview alone cannot enable landing. The Field Guide shows Fly to Earth before approach and exposes Land on Earth after clearance; manual clearance is saved with flight state and expires when leaving the nearby area.
- Replaced the intro Play music caption with a compact mute/unmute icon, retaining the earliest permitted audio start. Removed visible ship-name controls and header readout, kept saved pilot naming, and focused the pilot input when settings open. Existing ship-name storage is retained for compatibility. Updated README and player-facing update notes.
- Validation: browser navigation/geometry checks passed for preview-only denial, autopilot arrival clearance, manual approach, all three footpads on ground, hull clearance, and gear retraction; reviewed rendered Earth captures at desktop/phone size. Browser refresh/profile checks passed on desktop and touch phone viewport: no Play music caption after reload, trusted click starts audio, only pilot identity visible and editable/persistent. Audio scheduling checks and production build passed. Evidence: output/playwright/landing-gear/validation.log and output/playwright/profile-music/validation.log. Startup rendering was bypassed in the harness; Earth scenery was rendered for gear captures. No physical phone test performed.
- Git: uncommitted and not deployed.

## 2026-10-13 19:35:16 — Name-only readouts

- Removed the Pilot prefix from the header and first-person Earth HUD, retaining only the saved name. Settings keep their descriptive input label.
- Validation: inspected the markup and HUD copy after this text-only change.
- Git: uncommitted and not deployed.

## 2026-10-13 19:47:24 — Sound state, passive profile, menu input, and rounded corners

- Unified intro/header speaker icons and mute/unmute labels with actual audio context state. Zero music volume preserves enabled effects, track status reports music muted, and sound toggles retain volume. Saved mute survives refresh.
- Added a profile icon beside the saved name as a passive display, per the user’s correction. Settings remain on the gear menu; visible settings copy says Your name.
- Settings opening focuses the form, clears movement/touch controls, and blocks repeats of flight keys held when the menu opened until release. Deliberate name editing still works and closing restores focus to the menu.
- Added shared corner radii across panels, dialogs, photo cards, inputs, rectangular buttons, camera controls, and small feedback boxes; circular sound/menu icons remain circular.
- Validation: production build and audio checks passed. Desktop and touch viewport browser checks cover consistent icons/labels, zero volume, repeated toggles, suspended-context resume, held-W menu typing prevention, deliberate editing, passive profile, computed corner radii, refresh persistence, and 320px header bounds. Startup render preparation was bypassed by the harness; no physical phone listening test performed. Evidence: output/playwright/sound-profile-input/validation.log.
- Git: uncommitted and not deployed.

## 2026-10-13 19:52:36 — Consistent text/button colors and Earth log placement

- Consolidated neutral text colors into primary, secondary, muted, and on-accent tokens. Shared dark button backgrounds, borders, and light primary/selected states across intro, settings, guides, flight, and Earth; replaced green-tinted Earth utility buttons with the same monochrome treatment. Kept rounded corners and added the missing log-dialog radius.
- Moved the Earth Log button into a centered footer row with camera selection and photo capture. The camera selector occupies space only while walking, leaving a compact Log/photo pair while parked; DOM/focus order follows visual order.
- Validation: production build passed. Browser checks used actual Earth landing/walking scenes at 1440×900, 390×844, 320×740, and 844×390; dock items stayed within the viewport without overlap, shared colors matched computed styles, and Log opened its dialog. Reviewed desktop and phone rendered screenshots. Startup preparation bypassed by the harness; no physical-device test. Evidence: output/playwright/color-dock/validation.log.
- Git: uncommitted and not deployed.

## 2026-10-13 19:56:19 — Uniform Earth overlay colors

- Corrected the remaining inverse bright boarding/primary and selected camera treatments on Earth. Surface controls now use opaque dark backgrounds and matching light text across header, actions, log/photo dock, and touch controls. Camera selection uses a lighter dark fill and border; disabled landing actions retain an opaque background with muted text rather than fading into the landscape.
- Unified surface status, hints, welcome, profile, and astronaut-name text to the primary neutral color. Terrain materials were inspected, but this change addresses the UI mismatch following the user’s text/button consistency request.
- Validation: production build passed. Actual Earth landing/parked/walking browser checks passed at desktop, phone, narrow phone, and landscape viewports. Computed foreground/background colors match across actions and utility controls; selected camera and surface text assertions passed. Dock bounds and log opening passed; reviewed the phone render. Evidence: output/playwright/surface-uniform/validation.log. No physical-device test.
- Git: uncommitted and not deployed.

## 2026-10-13 19:59:44 — Light Earth HUD and daylight text contrast

- Followed the user’s clarification to make the on-land UI more white rather than black. Earth buttons, camera selector, touch controls, and exposed header/status/welcome/name labels now use light neutral surfaces with dark text. Selected camera uses gray fill and border; disabled actions remain opaque light gray. Removed the superseded dark Earth overrides.
- Local label backgrounds prevent white-on-bright-sky text without adding a full header/footer gradient. Preserved rounded corners and centered Earth utility dock; space and dark modal surfaces keep their existing theme.
- Validation: production build passed. Rendered parked/walking browser checks passed at desktop, phone, 320px phone, and landscape sizes. Computed colors matched light backgrounds/dark text across Earth actions, labels, and camera selection; dock bounds and Log action passed. Reviewed desktop and phone screenshots. Evidence: output/playwright/surface-light/validation.log. No physical-device test.
- Git: uncommitted and not deployed.

## 2026-10-13 20:01:21 — Restore background-free Earth labels

- Removed the rejected light Earth theme and white boxes behind the brand/profile, status, welcome, and astronaut name. Restored white text directly over the scene and shared dark controls, retaining rounded corners and the centered Log/camera/photo dock.
- Validation: production build and diff formatting checks passed. Earth browser checks passed at desktop, phone, 320px, and landscape sizes; computed label backgrounds are transparent with no pseudo-element backplates, text is white, camera selection and controls match the restored palette, and Log opens correctly. Reviewed phone screenshot. Evidence: output/playwright/surface-restored/validation.log.
- Git: uncommitted and not deployed.

## 2026-10-13 20:03:56 — White buttons on Earth only

- Set Earth header, action, touch, Log/photo, and camera controls to white backgrounds with dark text/icons; selected camera uses light gray. Preserved white scene labels without backgrounds, rounded corners, and centered Log placement. Space styling is unchanged.
- Validation: production build and diff formatting checks passed. Rendered Earth browser checks passed at desktop, phone, 320px phone, and landscape sizes; white button/dark text colors, white labels, transparent label backgrounds, dock bounds, and Log opening passed. Reviewed phone screenshot. Evidence: output/playwright/earth-white-buttons/validation.log.
- Git: uncommitted and not deployed.

## 2026-10-13 20:11:40 — Translucent controls, settings sound toggle, and larger manual

- Applied one charcoal/white-text button treatment across scenes with 40% tint in space and 65% on Earth. Selected states use a stronger shade and border. Preserved scene labels without backgrounds, rounded corners, and the centered Earth Log dock; removed conflicting older Earth control overrides.
- Removed intro/header music icons and added a Music and sound checkbox inside settings. The checkbox reflects the saved enabled preference even when browser autoplay suspends playback. Toggles preserve track/volume and persist across refresh. Intro now has a Settings button; the modal layers above loading/intro, restores focus, and hides Exit flight there.
- Removed Start exploring from the flight manual and its event binding. Increased manual width, paragraph/key-description/key-label sizes, retaining scroll and close/Escape behavior.
- Validation: audio checks, production build, and diff formatting checks passed. Desktop/touch viewport browser checks passed for absence of music icons after refresh, intro/settings access, saved mute, trusted unmute, zero-volume preservation, held-key protection, manual removal/larger copy, and Escape focus. Earth checks passed for translucent computed colors, transparent labels, dock layout at desktop/390px/320px/landscape, and Log opening. Reviewed manual and Earth phone screenshots. Evidence: output/playwright/shaded-settings/validation.log and output/playwright/shaded-earth/validation.log. No physical-device test.
- Git: uncommitted and not deployed.

## 2026-10-13 20:14:51 — Startup UI gate and profile pill

- Added loading-mode in initial markup, hiding all direct game UI except loading until actual scene preparation succeeds. Intro Settings starts hidden; readiness reveals it, and openSettings rejects calls while loading. Refresh/failure cannot expose it prematurely.
- Grouped name and refined circular profile icon in a shaded pill, preserving passive/non-clickable behavior. Leenard is the default for new profiles; saved names remain intact. Compact rules retain the pill at narrow widths.
- Validation: production build and diff formatting checks passed. Actual startup/preparation browser checks passed on desktop and touch phone: held initial loading hid intro/settings, programmatic settings opening was blocked, preparation completion enabled settings, refresh stayed clean, and profile pill was shaded, rounded, passive, and within 320px bounds. Reviewed phone pill screenshot. Evidence: output/playwright/startup-profile/validation.log. No physical-device test.
- Git: uncommitted and not deployed.

## 2026-10-13 20:20:59 — Moving-target autopilot and bounded completion

- Added short-horizon destination velocity prediction and velocity matching for moving worlds. Obstacle detours now include exit waypoints so reaching the entry does not repeatedly recreate the same approach. New courses explicitly clear old parking state.
- Recovery ages using actual active frame duration, independent of the 50ms physics cap. Reduced no-progress limit to 12 seconds and capped active flight deadline at 120 seconds, with the existing three-contact assisted safe arrival. Invalid distances request recovery. Hidden tabs and menus pause flight; visibility restoration discards the suspended frame gap, and UI reports menu pauses/recovery clearly.
- Validation: all 34 regression tests passed, including new stall/deadline/pause/contact/invalid-input checks. Browser simulation passed all 10 moving destinations, repeated-contact recovery, destination browsing without cancellation, explicit Cancel/P, very slow-frame flight completion at 120 active seconds, and a forced-stall Moon arrival at 16.85 seconds. All resulting positions were finite. Production build and diff formatting checks passed. Evidence: output/playwright/smarter-autopilot/validation.log. Startup preparation was bypassed in the simulation harness.
- Git: uncommitted and not deployed.

## 2026-10-13 20:27:26 — Grounded astronaut leg movement

- Replaced sine-driven hip/knee rotations with two-joint inverse kinematics. Corrected backward knee bending, introduced ankle joints that keep boots level, and adjusted standing hip height to ground the soles.
- World-space stance feet hold position while the body advances; swing feet lift and ease toward the next foothold. Stride follows actual distance/speed with larger running steps. Terrain height feeds foot placement, and pelvis weight/compression and airborne tuck support walk/run/jump/landing transitions. Idle feet settle under the body; reduced motion suppresses extra torso bob/twist. Existing gravity, collision, and camera controls remain in use.
- Validation: 37 regression tests passed, including grounded soles, forward knees, stance foot locking, level boots, terrain/turn/jump finite poses across 30/60/120 Hz, and existing Earth physics. Production build passed. Browser rig renders passed for idle/walk/run/jump/landing with finite joints; reviewed walk/run screenshots. Evidence: output/playwright/astronaut-gait/validation.log. Rendering used the production rig in an isolated scene; no physical-device test.
- Git: uncommitted and not deployed.

## 2026-10-13 20:37:08 — Simpler astronaut steps without leg twisting

- Replaced the exaggerated world-space foothold planner with a steady alternating local step cycle and forward/back hinge-joint leg solving. Legs stay in their own planes during turns, boots stay level, and foot height still samples terrain.
- Tuned clear medium-length strides (1.3m walk-cycle travel, 1.8m run-cycle travel), restrained foot lift, less pelvis crouch, smaller arm motion, and modest landing compression. Speed/distance drive the cycle and fading weight returns the legs to idle. This supersedes the previous world-space stance-foot description.
- Validation: all 11 targeted rig/Earth physics tests passed and production build passed. Actual Earth scene browser checks passed for walking, running, jumping, and post-jump stepping with no sideways hip rotation. Reviewed the walk screenshot beside the parked ship. Evidence: output/playwright/simple-gait/validation.log. Startup preparation bypassed in the harness; no physical-device test.
- Git: uncommitted and not deployed.

## 2026-10-13 20:43:02 — Remove duplicate Earth header identity

- Hide the header profile/name pill throughout Earth surface mode. Retain the name above the astronaut in third person and the first-person HUD identity; space retains the profile pill.
- Validation: browser computed styles confirmed Earth profile display none and restored space display flex; suit label remains present.
- Git: uncommitted and not deployed.

## 2026-10-13 20:50:03 — Keep Earth Settings in place and clarify parking

- Hiding the Earth profile pill removed the flex item that pushed header utilities right. Added an Earth-specific automatic left margin to Settings, retaining the same circular dimensions and behavior as space. Replaced the gear glyph with a shared drawn SVG; the proposed land-only text label was removed per the user’s correction.
- Earth orbital arrival now says Parked near Earth · ready to land; parked distance HUD reports parking instead of 11 units away. Earth station log descriptions clarify approach completion/ready to land without orbital-distance wording. Actual landing remains a separate action.
- Validation: production build and diff formatting checks passed. Browser checks passed parking text, hidden duplicate profile, Settings bounds/opening/sound control/Escape focus at 1440px, 390px, and 320px. Reviewed phone header capture; preparation/rendering was bypassed in the harness. Evidence: output/playwright/earth-settings/validation.log.
- Git: uncommitted and not deployed.

## 2026-10-13 20:54:08 — Refresh player update history

- Added the newest intro highlight/history group for smarter autopilot, clearer Earth parking, matching Settings access, persistent settings sound toggle, clean loading, translucent controls/profile identity, simpler astronaut steps, Earth Log dock, and the larger manual. Updated older intro-music wording to point to Settings.
- Validation: update module imports successfully; newest summary and eight notes are present, with five history groups. Existing rendering uses the newest entry automatically.
- Git: uncommitted and not deployed.

## 2026-10-13 20:58:01 — Prevent landing gear reappearing at takeoff end

- Fixed the departure state defaulting gear deployment back to 1 after ascent had retracted it. Gear now defaults to deployed only when parked/walking and stays retracted through departure and closure; descent/ascent retain their animated values.
- Validation: production build and diff formatting checks passed. Earth browser sequence confirmed three grounded supports while parked, retraction during ascent, no reappearance through four final departure frames, and closed gear hidden. Evidence: output/playwright/takeoff-gear/validation.log. Startup preparation was bypassed in the harness.
- Git: uncommitted and not deployed.

## 2026-10-13 21:00:52 — Categorized player update notes

- Refreshed the newest intro/history record with Fixed, Added, Improved, and Removed notes covering recent player-visible changes, including the gear reappearance bug, Earth Settings/parking, loading/menu/sound fixes, profile pill, astronaut gait, shaded controls, manual/log layout, and removed icons/duplicate name/manual action.
- Documented the ongoing update-note convention in README so additions, removals, and bug fixes all receive notes.
- Validation: updated module imports successfully with 14 latest notes across all four categories. Existing intro/history renderer consumes the record automatically.
- Git: uncommitted and not deployed.

## 2026-10-13 21:02:38 — Remove intro Settings

- Removed the intro Settings button, binding, readiness reveal, and dedicated styles. Settings rejects opening while the intro is active; the regular in-game gear button remains for space and Earth. Added a Removed note to player update history and corrected documentation.
- Validation: source check confirmed no intro-button references and retained in-game Settings; production build passed.
- Git: uncommitted and not deployed.

## 2026-10-13 21:05:52 — Move texture attribution into Settings

- Removed the floating bottom-right planet-map credit and its styling. Added a Credits section in Settings with Solar System Scope / INOVE attribution, source and CC BY 4.0 links, and the existing unchanged-texture/rendering note. Updated README and player update history.
- Validation: production build passed. Mobile viewport browser check confirmed Credits reachable by settings scrolling, source/license links retained, floating credit absent, and no horizontal overflow. UI-only harness bypassed game initialization.
- Git: uncommitted and not deployed.

## 2026-10-14 05:09:26 — Continuous Play-to-ship camera handoff

- Shared chase camera position between launch animation and normal flight so portrait aspect fitting cannot introduce an extra zoom/movement after launch. Captured launch focus from the actual current view instead of recomputing the intro shot, matching the initial orientation exactly. Blended chase roll during the launch, synchronized the ship transform, and cleared stale camera transitions while selecting chase view.
- Added October 14 player update notes and refreshed README. Preserved the existing 1.9-second orbital move and reduced-motion immediate handoff.
- Validation: browser numerical continuity checks passed start/end camera position, orientation, FOV, and ship orientation at 1440×900, 390×844, and 844×390; reduced-motion path passed. Existing launch-orientation checks passed all 361 headings. Production build and diff formatting checks passed. Evidence: output/playwright/play-transition/validation.log. Browser harness bypassed startup/rendering and stepped camera updates directly; this verifies pose continuity, not physical-device frame timing.
- Git: uncommitted and not deployed.

## 2026-10-14 05:24:18 — Desktop-only release scope and pre-commit review

- Added a lightweight device-gated entry module. Phones/tablets see Best explored on desktop without importing Three.js/game logic, loading planet images, or initializing audio. Narrow desktop windows and touchscreen laptops with a fine pointer remain supported. Removed the touch-control module, joystick/action markup/styles, touch reset hooks, and surface Jump button; keyboard/mouse flight and Earth movement remain. Removed the eager guide photo src so unsupported devices do not fetch it.
- Added a theme-aware SVG tab icon: dark on light themes and white on dark themes. Refreshed October 14 update notes, current README support/controls, and player change categories. Historical update/work-log records remain chronological. Generated commit history is left unchanged until a real commit exists.
- Validation: all 43 regression tests passed, audio checks passed, production build passed, and diff formatting check passed. Browser checks passed mobile notice/refresh with no game module or planet asset requests, narrow desktop admission, favicon themes, real desktop startup/Play/Settings/sound/Credits/manual, and no page errors. Earth landing/parked supports/ascent/final gear retraction passed after removing touch references. Static DOM ID reference audit passed. Reviewed mobile notice screenshot. Evidence: output/playwright/precommit/validation.log and output/playwright/desktop-landing/validation.log. No physical-phone test; Vite retains the existing large 3D chunk warning.
- Git: changes remain uncommitted and unstaged; no deployment performed. Suggested commit: feat: add Earth exploration and refine desktop gameplay.

## 2026-10-14 05:47:15 — Restore desktop drag-to-look after touch removal

- The removed touch-control module had also owned mouse dragging. Added dedicated desktop pointer handling on the canvas for Earth drag-to-look, planet-preview orbiting, and manual-flight aiming. Primary-button pointer capture keeps dragging stable; release/cancel/lost capture/window blur clears it. Intro/launch/menu guards block unwanted camera input, and autopilot course remains protected. Added grab/grabbing cursor feedback on Earth.
- Updated the newest Fixed note and clarified left-button dragging in README.
- Validation: all 43 regression tests and production build passed. Actual mouse-event Earth browser checks passed third-person and first-person camera changes, release stopping input, and menu guarding with no page errors. Evidence: output/playwright/earth-mouse-look/validation.log. Startup preparation was bypassed in the harness.
- Git: uncommitted and not deployed.
