# Odyssey — Solar System Explorer

A first-person and third-person space exploration prototype built for the browser with Three.js. Fly freely, discover unknown worlds, or follow a guided route through the solar system.

![Saturn and its rings in Odyssey's Exploration mode](docs/images/odyssey-saturn.webp)

*Saturn in Exploration mode, with the destination list and Field Guide open.*

## Highlights

- Explore 11 destinations: the Sun, eight planets, Earth's Moon, and a comet.
- Choose **Discovery** to scan and reveal destinations, or **Exploration** to browse them freely.
- Preview worlds, read NASA-sourced Field Guide notes, and use autopilot to visit them.
- Scan Olympus Mons, the Great Red Spot, and the Cassini Division.
- Record flybys, scans, arrivals, and asteroid encounters in the Captain's log.
- Save, download, and delete flight photos in a gallery.
- Follow optional Voyages, customize your ship and pilot names, and choose original music.
- Experience textured planets, sunlit atmospheres, Earth night lights, particle rings, and responsive collision effects.

## Run locally

Use Node.js **20.19+ in the 20.x series, or 22.12+**, as required by Vite.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Startup shows a loading screen while planet maps, guide photos, fonts, texture uploads, and shaders are prepared. The intro begins with the finished planet details.

For a production build and local preview:

```sh
npm run build
npm run preview
```

## Game modes

### Discovery

Start a **New game** beyond the planets or **Resume game** to restore your saved voyage. A new voyage initially coasts toward the solar system; a flight key hands you control.

Worlds remain unnamed and locked in Destinations until scanned. Follow the unidentified signal's bearing and audio pulse, aim the **+ reticle** at a nearby object, and hold **R**. Releasing R or losing the target resets the current scan. Completed scans reveal a name and fact, unlock the destination, and count toward all 11 discoveries. A flight key or Escape ends the reveal early.

Starting a new Discovery game clears that mode's saved progress, log, and photo gallery.

### Exploration

Choose **Play** to launch near Earth with every destination available. The ship starts above the Moon's orbital sweep. Older saved flights near that sweep are moved clear, and moving-body overlap recovery prevents the ship from becoming trapped.

Optional Voyages include **Inner Worlds**, **Giant Planets**, and **Outer Dark**. Visit their stops manually or choose **Fly to next stop**. Route progress saves locally, and you can leave a route at any time.

## Flight controls

| Key | Action |
| --- | --- |
| **W / S** | Fly forward / backward |
| **A / D** or **← / →** | Turn left / right; steering reverses while backing up |
| **Q / E** or **↑ / ↓** | Pitch the nose up / down |
| **Shift + W** | Boost forward |
| **C** | Switch first-person / third-person camera |
| **F** | Show or close information for the object under the reticle |
| **Hold R** | Scan a nearby world or landmark |
| **P** | Autopilot to the selected destination |
| **, / .** | Rotate a destination preview in 45° steps |
| **L** | Open the Captain's log |
| **T** | Save a flight photo |

Turning and pitching rotate the ship while stationary. Press W to fly along its heading. Manual pitch is limited to 75° above or below level and gradually returns to level after release. Reverse flight stays at normal speed and cancels boost.

Use the gear button to change ship and pilot names, music selection, and volume. The sound button mutes music and effects.

## Destinations and Field Guide

Select a destination to preview it and open its Field Guide while the ship stays in place. Use the preview's arrow buttons or **, / .** to look around it. **Return to ship** closes the preview without moving the ship.

Choose **Fly to** or press **P** to engage autopilot. The ship turns toward the destination, boosts on longer trips, avoids nearby bodies and larger rocks, and parks at a viewing distance. Arrival opens the destination preview and Field Guide. A flight key returns manual control.

The Sun supports previews and Field Guide facts but is excluded from autopilot.

Field Guide notes include rotation, orbit, atmosphere, notable features, credited imagery, and NASA source links. Landmark hints help locate features on Mars, Jupiter, and Saturn. Landmark scans work in both modes and save separately; Discovery hides their names until scanned.

## Captain's log and photos

Open **Captain's log** or press **L** to review scans, flybys, close approaches, autopilot arrivals, and asteroid encounters. Repeated completed passes create separate entries with their closest surface distance. Recent entries can include flight snapshots.

Press **T** or the camera icon to save the current 3D view. Open **Photo gallery** from the log to view, download, or delete photos. The log retains up to **250 entries** and the gallery up to **24 photos per mode**. Names of undiscovered objects stay hidden in Discovery.

Progress, names, preferences, logs, and photos are stored in your browser and do not sync between devices. Refreshing an active flight resumes its last saved position and heading in the same tab.

## Scene and sound

Local 2K planet maps provide surface detail. Earth has separate clouds and night lights masked to its dark hemisphere; atmospheric rims face the Sun, and Saturn casts a shadow onto its rings. Procedural surfaces remain available if a map cannot load.

The asteroid belt contains textured rocks, and Saturn's rings include drifting ice pieces. Gentle contacts deflect the ship and push rocks aside. Stronger impacts can fracture rocks into moving fragments and dust, with ice breaking more easily than stone. Swept collision checks account for fast flight and moving rocks.

A comet follows an elliptical orbit with a glowing coma, curved dust tail, and narrow blue ion tail. Its activity strengthens near the Sun, while a faint outer-system tail keeps it visible. Its preview frames the tails from the side.

Three original scores are available: **Odyssey**, **Event Horizon**, and **Starlight Drift**. Choose one track or a rotating playlist, with music volume from 0% to 150%. Tracks crossfade; engine audio responds to thrust and boost. Impact sounds, stereo direction, music ducking, and camera recoil respond to contact strength. Browsers that restrict autoplay require a click or key press to begin audio.

The intro keeps ship and planet motion smooth while distant debris and comet effects update less often. Flight restores their full update rate. System reduced-motion preferences make camera changes immediate and disable camera shake and idle motion.

## Design notes and credits

Odyssey favors readable navigation over astronomical scale: planets are enlarged and orbital distances compressed. It is an interactive prototype, not a scientific simulator.

- **Planet maps:** [Solar System Scope / INOVE](https://www.solarsystemscope.com/textures/), under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Maps use NASA imagery and elevation data with adjusted colors and reconstructed gaps. See [texture attribution](public/planet-textures/ATTRIBUTION.md).
- **Field Guide imagery:** credited NASA spacecraft images and mosaics, linked beside each image. Sources are recorded in [planet-photos.js](src/planet-photos.js); asset URLs are recorded in the [download script](scripts/download-planet-photos.ps1). The Sun image is an ultraviolet observation, and Earth is a satellite mosaic.
- **Facts and landmarks:** NASA source links appear in the Field Guide. Additional references include [Saturn](https://science.nasa.gov/saturn/facts/) and [comets](https://science.nasa.gov/solar-system/comets/facts/).
- **Intro quote:** Neil Armstrong's first step on the Moon, using [NASA's published wording](https://www.nasa.gov/history/50-years-ago-one-small-step-one-giant-leap/).
- **Typography:** Oxanium for display text and DM Sans for descriptions.
- **Music, ship effects, and procedural comet and asteroid surfaces:** created for this project.

## Development checks

Built with **Three.js**, **JavaScript**, and **Vite**.

```sh
node --test tests/*.test.js
node scripts/check-audio.mjs
npm run build
```

Checks cover world overlap recovery, asteroid collision physics, comet motion and tails, landmarks, flyby tracking, and audio scheduling.

The [Playwright CLI configuration](.playwright/cli.config.json) uses the native browser window size so interactive testing follows actual window resizing.
