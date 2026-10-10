# Odyssey — Solar System Explorer

A first-person and third-person space exploration prototype built for the browser with Three.js. Odyssey combines free flight, guided discovery, and an interactive field guide to make exploring the solar system feel like a journey.

![Saturn and its rings in Odyssey's Exploration mode](docs/images/odyssey-saturn.webp)

*Saturn in Exploration mode, with the destination list and Field Guide open.*

## Highlights

- Explore the Sun, planets, Earth's Moon, and a comet through free flight or autopilot.
- Choose **Discovery** to scan and reveal 11 destinations, or **Exploration** to browse them freely.
- Read NASA-sourced facts and credited imagery in each world's Field Guide.
- Record flybys, scans, and encounters in the Captain's log, with a photo gallery for flight snapshots.
- Follow optional Voyages and scan landmarks such as Olympus Mons, the Great Red Spot, and the Cassini Division.
- Customize a ship and pilot, with original music and responsive engine and collision audio.
- Use reduced motion settings for more immediate camera changes.

## Built with

Three.js, JavaScript, Vite, and browser storage. The 3D scene includes animated planets, Saturn's particle rings, an asteroid belt, ship effects, and a comet. Progress and photos are saved in the browser for each game mode.

## Design notes

<<<<<<< HEAD
Odyssey favors readable navigation over astronomical scale: planets are enlarged and orbital distances compressed. Its Field Guide uses credited NASA imagery and source links. The three continuous music scores and flight sound effects were created for the project.

This is an interactive prototype, not a scientific simulator. Flight progress is local to the browser and does not sync between devices.
=======
Startup shows a loading screen until the planet surfaces, guide photos, fonts, texture uploads, and shaders are ready. The intro then starts with the finished planet details. Distant debris and comet effects update at a lower rate on the title screen; flight restores their full update rate.

Exploration launches near Earth above the Moon's orbital sweep. If a moving world overlaps the ship, including in a restored flight, the ship is moved clear so manual controls remain usable.

Open the local URL printed by Vite and choose a mode on the intro screen. The intro shows the ship flying slowly near Earth before the camera moves into third-person flight. Refreshing during a flight resumes at the ship's last position and heading in the same browser tab. Use **W/S** to fly forward and back, **A/D** to turn left and right, **Q/E** to pitch the nose up and down, and **Shift+W** to boost forward. While holding **S**, A/D and the left/right arrow keys steer in reverse, like backing up a car. Reverse flight stays at normal speed and cancels the boost effect. Boost spools up and winds down, with brighter engine exhaust, subtle speed streaks, and a wider camera view. Q/E rotates the ship without moving it, is limited to 75° above or below level, and slowly returns to level after release. Press W to fly along the current heading. The **arrow keys** provide alternate turn and pitch controls. The ship banks into turns and carries visible navigation, engine, and nose lights. Switch between **First person** and **Third person** cameras with the buttons or **C**. Use the gear button to name your ship and pilot; those names are saved in your browser.

The intro quotes Neil Armstrong's first step on the Moon, using [NASA's published wording](https://www.nasa.gov/history/50-years-ago-one-small-step-one-giant-leap/). Display text uses Oxanium; descriptions use DM Sans.

## Destinations and Field Guide

Click a destination, including Earth's Moon, to glide into a preview and open its info panel while the ship stays in place. Aim the ship's **+ reticle** at a planet to see its name; press **F** to open its info without entering preview, and press **F** again to close it. Choose **Fly to** or press **P** to return to the ship and engage autopilot. The ship turns toward the destination, boosts during the long cruise, steers around nearby bodies, and parks at a safe viewing distance. On arrival, the camera eases into the same planet scene used by a Destinations preview and opens the Field Guide while the ship holds position. Use the preview's **<** and **>** buttons, or the **,** and **.** keys, to rotate the view around the planet in 45° steps for a full 360° look. Use a flight key to take manual control, or press the destination button again to cancel the flight. **Return to ship** closes a preview without moving the ship. Reduced motion settings make camera switches immediate.

The Destinations panel has a close button and a labeled button to reopen it; its closed state is saved in this browser. The field guide opens when you choose a destination, arrive there by autopilot, or press **F** while aiming the + reticle at a planet or the Sun. Close it with **F** or its close button. A manual collision does not open the guide. **Explore more facts** shows rotation, orbit, atmosphere, notable features, and a link to NASA's full fact sheet for each world and the Sun. The Sun can be previewed from a safe distance but cannot be selected for autopilot. Planetary orbits and the asteroid belt are spaced 3.2 times farther apart to make flights take longer. The space backdrop is nearly black.

Field guide images in `public/planet-photos/` are NASA spacecraft photos or photo mosaics, credited and linked beside each image. Their source pages are recorded in `src/planet-photos.js`; `scripts/download-planet-photos.ps1` records the downloaded asset URLs. The Sun image is an ultraviolet observation, and the Earth image is a satellite mosaic.

## Flight atmosphere

Three original, continuous scores play in the browser: the original Odyssey theme, the cinematic Event Horizon, and the calmer Starlight Drift. Ship settings lets you choose a track or a playlist that rotates through all three; the choice and the 0%–150% music volume are saved in this browser. Track changes crossfade while you fly. Engine sound follows speed and boost, and the music softens during boost so flight cues remain clear. The sound button in the top bar mutes music and effects. The game attempts to start music on load; browsers that restrict autoplay begin playback on the first click or key press.

The planets are enlarged relative to the ship so they dominate the flight view. Orbital distances remain compressed for navigation rather than following one astronomical scale.
The rendered worlds use local 2K equirectangular maps from [Solar System Scope](https://www.solarsystemscope.com/textures/), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Credits also ship in `public/planet-textures/ATTRIBUTION.md` and appear in the scene. These NASA-data-based visualization maps include adjusted colors and reconstructed gaps. Earth has a separate cloud layer and night lights masked to its dark hemisphere. Thin atmospheric rims follow the Sun, Saturn casts a shadow onto its rings, and bare rock has restrained surface relief. Sunlight direction is consistent; brightness is balanced for the compressed game distances. Procedural surfaces remain available if a map cannot load.
The asteroid belt between Mars and Jupiter contains textured 3D rocks. Gentle contacts push rocks aside and deflect the ship without breaking them. Impact response uses relative closing speed, rock mass, and contact direction; strong impacts can fracture rocks, with ice breaking at a lower speed than stone. Swept contact checks prevent fast flight from skipping small rocks. Fragments inherit the rock's momentum and disperse with a faint dust cloud. Hull taps, heavier resonances, stereo direction, brief music ducking, and camera recoil scale with the actual impact; reduced motion disables camera shake. Autopilot routes around larger rocks.
Direct hits at normal forward speed (14 units/s) fracture small belt stones; larger rocks need stronger impacts. Glancing hits and rocks already moving with the ship can stay intact. Moving ring pieces use relative swept checks, and the first contact along the flight path is resolved before more distant rocks.
The engine responds to thrust load: coasting quiets the machinery, while boost adds a low filtered rumble that spools up and fades out smoothly. These are sounds heard aboard the ship. The scores use softly detuned pads, filtered stereo reverb, and dynamic compression to keep layered effects from clipping. Planetary lighting has darker night sides and Sun-facing atmospheric rims, and boost streaks stay restrained during flight.
After a world is unlocked, its Field Guide notes can point toward a nearby landmark. Aim the + reticle at Olympus Mons on Mars, Jupiter's Great Red Spot, or the Cassini Division in Saturn's rings and hold **R** from close range to record it. Landmark scans work in both modes, save separately, reveal a short NASA-sourced fact, and appear in the Captain's log. Discovery keeps a landmark's name hidden until it is scanned.
Saturn's rings include a visible gap and thousands of individual ice-colored particles. Larger drifting pieces can fracture on impact, while the gap leaves a sparse route through the rings. Saturn autopilot parks outside the ring edge for a manual approach. The ring and gap are inspired by [NASA's Saturn overview](https://science.nasa.gov/saturn/facts/).
While parked, the ship makes tiny attitude corrections with occasional side thruster flashes, and belt asteroids tumble slowly in place. These idle effects stop under reduced motion settings.

## Game modes

Choose **Discovery** or **Exploration** on the intro screen. Discovery always offers **Resume game** and **New game**. Resume restores the saved ship position and scans; New game clears Discovery progress and starts far beyond the planets, facing the solar system. The ship coasts forward on its own until you press a flight key, which smoothly hands you control. In Discovery mode, worlds and the comet stay unknown and locked in Destinations until you scan them; their names and Field Guide facts remain hidden, and autopilot cannot target them. Aim the ship's + reticle at a nearby object and hold **R** to scan it. Completed scans briefly frame the object, reveal its name and a fact, unlock it in Destinations, and count toward all 11 discoveries. Press a flight key or Escape to end the reveal early. Scan progress resets if you release R or lose the target; completed discoveries and the selected mode are saved in this browser. Scanning never opens the Field Guide automatically. Exploration mode lets you select, preview, read about, and autopilot to every destination without scanning.
In Discovery flight, a monochrome signal readout points toward the nearest unscanned object within range. It gives a relative direction and signal strength without revealing the object's identity. A soft two-tone receiver pulse gets more frequent as you approach and pans toward the source; scanning that object moves the signal to the next unknown destination.
One simulated comet follows a long elliptical orbit on the simulation clock. Its glowing coma, curved dust tail, and narrow blue ion tail strengthen near the Sun; a faint tail remains visible in the outer system to keep this stylized visitor recognizable. Tail particles stream away from the Sun, following [NASA's comet overview](https://science.nasa.gov/solar-system/comets/facts/). The close-up preview frames it from the side so the tails are visible. Discovery hides its identity until scanned; Exploration makes it available in Destinations and autopilot. A close encounter can be saved with a flight snapshot in the Captain's log.
Exploration also offers three optional Voyages: Inner Worlds, Giant Planets, and Outer Dark. Choose a route from the Voyages button below Captain's log, then visit each stop manually or use **Fly to next stop**. Route progress saves in this browser and never locks free flight.

## Captain's log and photos

The **Captain's log** button below Destinations, or the **L** key, opens a record of scans, close approaches and flybys, autopilot station keeping arrivals, and asteroid encounters. Its title uses the Pilot name from Ship Settings, such as "Captain Leenard's Log." The button moves to the bottom of the Destinations panel while that panel is open. Each completed close pass creates its own entry with the closest surface distance, including later visits to the same world. Turning back near a world is recorded as a close approach. Collisions with different asteroids are logged separately. Recent entries include images captured from the flight view; older entries keep their text when image storage is needed for new events. The log retains the latest 250 entries separately for Discovery and Exploration in this browser; starting a new Discovery game clears that voyage's log. Entries for unscanned worlds keep their names hidden until those worlds are discovered.
Press **T** or the camera icon to save the current 3D view. Open Captain's log with **L**, then choose **Photo gallery**. Select a thumbnail to view it large; you can also download or delete your shots. The gallery holds up to 24 photos per mode in this browser. Photos aimed at unscanned objects keep their names hidden in Discovery. Starting a new Discovery game clears its gallery; Exploration photos stay saved.
>>>>>>> e7928d8 (- Planet visuals: local 2K textures, Earth clouds and night lights, atmospheric rims, ring shadows, and texture attribution.)
