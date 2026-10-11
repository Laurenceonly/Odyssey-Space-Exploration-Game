# Odyssey commit history

All dates and times use **Asia/Manila (UTC+08:00)**. Entries appear newest first in Git history order and use the commit timestamp; rebased commits also show their original author time when it differs.

This file is generated from local Git history. Commit messages describe the work as recorded at the time; they do not prove a deployment or test result. Uncommitted edits are recorded separately in [the work log](docs/WORK_LOG.md).

Refresh after committing changes:

```sh
node scripts/update-commit-history.mjs
```

The snapshot includes commits present when the command runs. A commit that adds this snapshot will appear on the next refresh.

## 2026-10-11 20:13:16 — e93e01c

[View commit](https://github.com/Laurenceonly/Odyssey-Space-Exploration-Game/commit/e93e01c87fc7313c46b6956b4f22eba6bc672c2c)

- Add Vercel Analytics dependency

<details>
<summary>Files changed (A = added, M = modified, D = deleted)</summary>

```text
M	package-lock.json
M	package.json
```

</details>

## 2026-10-10 13:16:11 — ecd6c45

[View commit](https://github.com/Laurenceonly/Odyssey-Space-Exploration-Game/commit/ecd6c45b914dcc78c8759dc0eb1eba8769feba14)

- Document Vercel deployment workflow

<details>
<summary>Files changed (A = added, M = modified, D = deleted)</summary>

```text
M	README.md
```

</details>

## 2026-10-10 13:13:35 — 3988554

[View commit](https://github.com/Laurenceonly/Odyssey-Space-Exploration-Game/commit/39885549018e799124a2c49e2efbe2d4a0a1e5d7)

- Configure Odyssey for Vercel deployment

<details>
<summary>Files changed (A = added, M = modified, D = deleted)</summary>

```text
M	.gitignore
A	.vercelignore
A	vercel.json
```

</details>

## 2026-10-10 09:11:11 — 42a5724

[View commit](https://github.com/Laurenceonly/Odyssey-Space-Exploration-Game/commit/42a5724cf23c38d46d4268cadcc41418d1c31564)

- readme changes

<details>
<summary>Files changed (A = added, M = modified, D = deleted)</summary>

```text
M	README.md
```

</details>

## 2026-10-10 09:01:23 — d971a78

[View commit](https://github.com/Laurenceonly/Odyssey-Space-Exploration-Game/commit/d971a783b83d819144636c13b01dfd0472bcd88e)

- Planet visuals: local 2K textures, Earth clouds and night lights, atmospheric rims, ring shadows, and texture attribution.
- Collisions: improved asteroid and ring-fragment physics, fracture effects, dust, impact sounds, and camera recoil.
- Comet: revised orbit, more visible dust and ion tails, and improved preview framing.
- Moon safety: safer Exploration spawning and recovery for overlapping or older saved flights.
- Startup: preload planet details and shaders behind a loading screen; reduce background work during the intro.
- Launch fix: preserve ship rotation when the camera hands control to the player.
- Responsive browser: disable fixed Playwright viewport sizing.
- Updated landmark positions, documentation, and regression tests.

Original author time: 2026-10-10 08:44:55 (Asia/Manila).

<details>
<summary>Files changed (A = added, M = modified, D = deleted)</summary>

```text
A	.playwright/cli.config.json
M	README.md
M	index.html
A	public/planet-textures/2k_earth_clouds.jpg
A	public/planet-textures/2k_earth_daymap.jpg
A	public/planet-textures/2k_earth_nightmap.jpg
A	public/planet-textures/2k_jupiter.jpg
A	public/planet-textures/2k_mars.jpg
A	public/planet-textures/2k_mercury.jpg
A	public/planet-textures/2k_moon.jpg
A	public/planet-textures/2k_neptune.jpg
A	public/planet-textures/2k_saturn.jpg
A	public/planet-textures/2k_sun.jpg
A	public/planet-textures/2k_uranus.jpg
A	public/planet-textures/2k_venus_atmosphere.jpg
A	public/planet-textures/ATTRIBUTION.md
M	scripts/check-audio.mjs
A	src/atmosphere.js
M	src/audio.js
A	src/body-clearance.js
A	src/comet-tail.js
M	src/landmarks.js
M	src/main.js
A	src/planet-materials.js
A	src/rock-physics.js
M	src/space-events.js
M	src/style.css
A	tests/body-clearance.test.js
M	tests/landmarks.test.js
A	tests/rock-physics.test.js
M	tests/space-events.test.js
```

</details>

## 2026-10-10 08:50:03 — f90c7e7

[View commit](https://github.com/Laurenceonly/Odyssey-Space-Exploration-Game/commit/f90c7e7ee93d8beb7e7899d2ee3916b95b291df8)

- Revise README for clarity and structure

Updated README to clarify project features and usage instructions.

<details>
<summary>Files changed (A = added, M = modified, D = deleted)</summary>

```text
M	README.md
```

</details>

## 2026-10-09 14:30:16 — b6042ad

[View commit](https://github.com/Laurenceonly/Odyssey-Space-Exploration-Game/commit/b6042ad608e38ce95483941f09faa9e9252e0b39)

- Focus Odyssey README on project highlights

Updated the README to enhance clarity and detail about the Odyssey project, including changes to the description, highlights, and sections on game modes and flight atmosphere.

<details>
<summary>Files changed (A = added, M = modified, D = deleted)</summary>

```text
M	README.md
```

</details>

## 2026-10-09 12:44:14 — 1c5c4a4

[View commit](https://github.com/Laurenceonly/Odyssey-Space-Exploration-Game/commit/1c5c4a4fa13ca896a3a15803322c148b8018a9e2)

- Add README overview and Saturn screenshot

<details>
<summary>Files changed (A = added, M = modified, D = deleted)</summary>

```text
M	README.md
A	docs/images/odyssey-saturn.webp
```

</details>

## 2026-10-09 12:19:51 — 4eb076a

[View commit](https://github.com/Laurenceonly/Odyssey-Space-Exploration-Game/commit/4eb076a7181f99f683f904fee65e5c073c0644d0)

- Selecting a scanned world now shows **Explore more facts**.
- The guide scrolls on smaller screens, so the button stays reachable.
- Switching worlds resets the guide’s scroll position.

<details>
<summary>Files changed (A = added, M = modified, D = deleted)</summary>

```text
M	src/main.js
M	src/style.css
```

</details>

## 2026-10-09 10:50:30 — a7dad84

[View commit](https://github.com/Laurenceonly/Odyssey-Space-Exploration-Game/commit/a7dad849b39c87756acc1e6eddd181255a50e1a5)

- Add landmark scans, Saturn rings, and photo gallery

<details>
<summary>Files changed (A = added, M = modified, D = deleted)</summary>

```text
M	README.md
M	index.html
A	src/landmarks.js
M	src/main.js
M	src/style.css
A	tests/landmarks.test.js
```

</details>

## 2026-10-09 02:59:30 — b3dd821

[View commit](https://github.com/Laurenceonly/Odyssey-Space-Exploration-Game/commit/b3dd821927beab73d1be4ae99822df7cb7b1e8b8)

- A Captain’s log for scans, flybys, close approaches, autopilot arrivals, and asteroid encounters, with flight snapshots.
- More immersive asteroid impact and engine boost audio.
- An unidentified signal that helps you find unscanned objects in Discovery.
- A moving comet that can be scanned and visited, bringing Discovery to **11 objects**.
- Three optional Exploration Voyages with saved progress.

<details>
<summary>Files changed (A = added, M = modified, D = deleted)</summary>

```text
M	README.md
M	index.html
M	src/audio.js
M	src/discovery.js
A	src/flyby-tracker.js
M	src/main.js
A	src/space-events.js
M	src/style.css
A	tests/flyby-tracker.test.js
A	tests/space-events.test.js
```

</details>

## 2026-10-09 01:35:46 — 70ad82b

[View commit](https://github.com/Laurenceonly/Odyssey-Space-Exploration-Game/commit/70ad82bccb8b2a516a3a47b82cb65a356f5c447c)

- **Discovery and Exploration modes.** Discovery locks planet names, facts, and autopilot destinations until you scan them; Exploration leaves them open.
- **Discovery saves.** The intro offers Resume or New game. New games start far from the planets and coast forward until you take control.
- **Planet unlocks.** Holding **R** scans a world, saves the discovery, and plays a cinematic reveal with a fact and sound cue.
- **Flight changes.** Asteroids react to impacts, and autopilot handles steep climbs and dives more smoothly.
- **Arrival previews.** Autopilot parks near the planet, opens the usual preview and Field Guide, and lets you orbit the view with **\< / \>** or **, / .**.

<details>
<summary>Files changed (A = added, M = modified, D = deleted)</summary>

```text
M	README.md
M	index.html
M	src/audio.js
M	src/main.js
M	src/style.css
```

</details>

## 2026-10-08 20:48:43 — 6d0ba3f

[View commit](https://github.com/Laurenceonly/Odyssey-Space-Exploration-Game/commit/6d0ba3fad2d5ab0316802f939c7015935e358bd5)

- Fixed the missing CSS after refresh or Return to intro, and removed the unwanted focus ring when the Esc confirmation opens.
- Added a smoother Play camera path toward the ship, plus a fade for refresh and Return to intro.
- Added 3D asteroids between Mars and Jupiter. Larger rocks block the ship, and autopilot routes around them.
- Made **Fly to** boost on long trips and slow down near its destination.
- Stopped the Field Guide from opening automatically on arrival or collision. It still opens through Destinations or **F**.
- Updated the README.

<details>
<summary>Files changed (A = added, M = modified, D = deleted)</summary>

```text
M	README.md
M	index.html
M	src/main.js
M	src/style.css
```

</details>

## 2026-10-08 20:14:10 — e02698a

[View commit](https://github.com/Laurenceonly/Odyssey-Space-Exploration-Game/commit/e02698a2d9e6780f4384ef106f7e197a2b756527)

- Expanded the field guide with facts for the Sun, Moon, and all eight planets, plus more to learn when you arrive.
- Added 10 local NASA planet and Sun images with credits, and fixed the spacing between each image and its name.
- Made an active flight resume after a page refresh and reversed A/D steering while backing up.
- Added two original space tracks, a playlist option, smooth track changes, and a saved music preference.
- Removed the Play button’s unintended focus outline and updated the controls and README

<details>
<summary>Files changed (A = added, M = modified, D = deleted)</summary>

```text
M	README.md
M	index.html
A	public/planet-photos/earth.jpg
A	public/planet-photos/jupiter.png
A	public/planet-photos/mars.jpg
A	public/planet-photos/mercury.jpg
A	public/planet-photos/moon.jpg
A	public/planet-photos/neptune.jpg
A	public/planet-photos/saturn.jpg
A	public/planet-photos/sun.jpg
A	public/planet-photos/uranus.jpg
A	public/planet-photos/venus.png
A	scripts/check-audio.mjs
A	scripts/download-planet-photos.ps1
M	src/audio.js
A	src/discovery.js
M	src/main.js
A	src/planet-photos.js
M	src/style.css
```

</details>

## 2026-10-08 18:33:21 — 92f1452

[View commit](https://github.com/Laurenceonly/Odyssey-Space-Exploration-Game/commit/92f145217647e8715e6a9d064ff7dc6a7e958367)

- Changed the UI to black and white while keeping color in the planets and previews. Removed the header, footer, and Play button borders.
- Made third person the default camera, removed the cockpit view, and smoothed camera changes.
- Enlarged the planets relative to the ship and fixed the ship’s tendency to pitch nose down.
- Replaced the destination dots with consistent, textured planet icons, including rings for Saturn and Uranus.
- Reworked the panels: Destinations has a labeled reopen button; Planet info opens from a destination or when the ship’s **\+ reticle** targets a planet and you press **F**. F also closes it.
- Made refresh resume an active flight. Added a confirmed exit through ESC or Settings and a saved setting for flight instructions.
- Updated the README to describe the current control

<details>
<summary>Files changed (A = added, M = modified, D = deleted)</summary>

```text
M	README.md
M	index.html
M	src/main.js
M	src/style.css
```

</details>

## 2026-10-08 15:35:59 — b79bb6e

[View commit](https://github.com/Laurenceonly/Odyssey-Space-Exploration-Game/commit/b79bb6eed51b715b7d8398b414246522f95fb6e6)

- Added the intro: the ship flies near Earth, then **Play** moves the camera into the cockpit.
- Spaced the planetary orbits and asteroid belt **2\.7× farther apart**.
- Limited boost and its visual effect to **Shift+W**; reversing stays at normal speed.
- Added continuous music, engine sounds, flight cues, a sound toggle, and a music volume slider.
- Moved the destinations toggle beside its panel. The field guide now opens on selection and hides after 12 seconds of inactivity.
- Changed space to near black, switched display text to **Oxanium**, and added the Neil Armstrong quote

<details>
<summary>Files changed (A = added, M = modified, D = deleted)</summary>

```text
M	README.md
M	index.html
A	output/audio-smoke.mjs
A	src/audio.js
M	src/main.js
M	src/style.css
```

</details>

## 2026-10-08 14:41:25 — e654ef0

[View commit](https://github.com/Laurenceonly/Odyssey-Space-Exploration-Game/commit/e654ef0d8eb07af17e88e990ff34fc6238490b69)

- added controls, plannets, different camera angles, boost feauture, autopilot feature and more

<details>
<summary>Files changed (A = added, M = modified, D = deleted)</summary>

```text
A	.gitignore
M	README.md
A	index.html
A	package-lock.json
A	package.json
A	src/main.js
A	src/style.css
```

</details>

## 2026-10-08 12:40:37 — 07ded2a

[View commit](https://github.com/Laurenceonly/Odyssey-Space-Exploration-Game/commit/07ded2a835499091a971231950d67a7d29520f7d)

- Initial commit

<details>
<summary>Files changed (A = added, M = modified, D = deleted)</summary>

```text
A	README.md
```

</details>
