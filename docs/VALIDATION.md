# Odyssey validation record

Recorded: **2026-10-11 21:27:26 Asia/Manila (UTC+8)**.

## Changes checked

- Vercel Web Analytics initialization in production builds; development does not load the tracking script.
- Field Guide scrolling: guide actions stay inside the flight viewport rather than extending under the footer.
- Restored local setup, deployment, and development-check instructions alongside the revised README copy.
- Added dated commit history and a work log.

## Results

| Check | Result |
| --- | --- |
| Existing Node regression tests | 22 passed; 0 failed |
| Audio scheduling, playlist, switching, and saved preference check | Passed |
| Vite production build | Passed |
| Exploration previews | All 11 destinations opened |
| Moon autopilot | Arrived, opened preview, and recorded a station entry |
| Photo capture and persistence | Photo saved and remained after reload |
| Flight refresh | Restored saved ship position with zero measured displacement |
| Gentle asteroid contact | Rock survived; ship speed remained finite |
| Strong asteroid contact | Rock fractured; ship speed and position remained finite |
| Discovery scan | Sun scan completed through the R key and recorded a scan log entry |
| Discovery refresh | Scanned world remained unlocked |
| Guide action at 1440×900, 764×485, and 390×844 | Button center remained clickable; no app scroll or horizontal page overflow |
| Completed browser runs | No page errors |
| Development analytics | No tracking script injected |
| Production analytics injection | Correct SDK script URL and version 2.0.1 |
| Live Vercel script endpoint | HTTP 200 with JavaScript content |

## Method and limits

Chromium was automated with Playwright CLI in an isolated test session. Development playtests added temporary access to game state through intercepted module responses to position the ship for scan and collision checks; those hooks are absent from committed source and production builds. Destination previews, autopilot, photo capture, refresh, and the scan used the app's normal controls and save logic. Collision checks invoked the integrated collision handler with real asteroid geometry and an explicit frame duration.

The production-preview analytics endpoint was stubbed only during local performance measurement because Vercel serves it on hosted deployments. Live HTTP 200 confirms the hosted script endpoint is available; it does not by itself prove a page view was collected. Deployed request verification is recorded below when complete.

Phone-sized checks used a resized Chromium viewport, not a physical phone. Safari, Firefox, touch gestures, photo download/delete, and every possible autopilot route were not covered. Chromium emitted expected audio-autoplay warnings before a user gesture. Early harness attempts were excluded after session interruptions and an omitted frame-duration argument in the test; only completed corrected runs appear above.

Local artifacts are under `output/playwright/` and excluded from Git.

## 2026-10-11 21:31:29 — Hosted verification

GitHub `main` received commit `3e68224` (analytics initialization, Field Guide scrolling, and development documentation). The live site then served the expected `/assets/index-J5_xYZU1.js` production bundle with HTTP 200. Its analytics script loaded with HTTP 200 and SDK version 2.0.1; the hosted page had no page errors.

No page-view POST was observed in Chromium automation. Inspection of Vercel's served script confirmed an early return when `navigator.webdriver` is true or the user agent contains `Headless`. The test did not bypass that filter or manufacture visitor data. SDK deployment and script availability are verified; dashboard ingestion remains unverified because no normal visitor or authenticated dashboard was available in the connected tools. To confirm counts, visit the [live game](https://odyssey-explorer-psi.vercel.app) in a normal browser and check the project's Web Analytics dashboard.


## 2026-10-17 — Fernlilt and header review

- Full regression suite: 138 passed, zero failed. Coverage includes grass placement and quality switching, scenic route traversal, creek banks and crossings, map state, and existing movement/flight behavior.
- Audio scheduling, playlist switching, and saved-choice checks: passed.
- Production build and Git whitespace checks: passed after the final FPS correction. Existing large-chunk warning remains.
- Browser startup and flight checks: no page errors observed. Chrome emitted expected audio-autoplay warnings before user interaction.
- The original plain FPS counter now uses one shared placement beside Odyssey in both scene headers; profile name/icon are hidden.
- Full live-map browser verification was interrupted. The final rendered land/space header comparison was also interrupted; these checks are not recorded as completed. Automated geometry, movement, and map tests do not establish visual quality or device-specific frame rate.
- Changes are local and uncommitted. No push or deployment was performed.
