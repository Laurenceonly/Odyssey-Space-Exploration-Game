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
