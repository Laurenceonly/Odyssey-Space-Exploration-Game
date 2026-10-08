# Odyssey — Solar System Explorer

A first-person, browser-based space exploration prototype built with Three.js.

## Run

```sh
npm install
npm run dev
```

Open the local URL printed by Vite and choose **Play**. The intro shows the ship flying slowly near Earth before the camera moves into third-person flight. Refreshing during a flight resumes at the ship's last position and heading in the same browser tab. Use **W/S** to fly forward and back, **A/D** to turn left and right, **Q/E** to pitch the nose up and down, and **Shift+W** to boost forward. While holding **S**, A/D and the left/right arrow keys steer in reverse, like backing up a car. Reverse flight stays at normal speed and cancels the boost effect. Boost spools up and winds down, with brighter engine exhaust, subtle speed streaks, and a wider camera view. Q/E rotates the ship without moving it, is limited to 28° above or below level, and slowly returns to level after release. Press W to fly along the current heading. The **arrow keys** provide alternate turn and pitch controls. The ship banks into turns and carries visible navigation, engine, and nose lights. Switch between **First person** and **Third person** cameras with the buttons or **C**. Use the gear button to name your ship and pilot; those names are saved in your browser.

The intro quotes Neil Armstrong's first step on the Moon, using [NASA's published wording](https://www.nasa.gov/history/50-years-ago-one-small-step-one-giant-leap/). Display text uses Oxanium; descriptions use DM Sans.

Click a destination, including Earth's Moon, to glide into a preview and open its info panel while the ship stays in place. Aim the ship's **+ reticle** at a planet to see its name; press **F** to open its info without entering preview, and press **F** again to close it. Choose **Fly to** or press **P** to return to the ship and engage autopilot. The ship turns toward the destination, steers around nearby bodies, cruises at a measured speed, and stops at a viewing distance. Use a flight key to take manual control, or press the destination button again to cancel the flight. **Return to ship** closes a preview without moving the ship. Reduced motion settings make camera switches immediate.

The Destinations panel has a close button and a labeled button to reopen it; its closed state is saved in this browser. The field guide opens when you choose a destination or press **F** while aiming the + reticle at a planet or the Sun. Close it with **F** or its close button. **Explore more facts** opens field notes about each world and the Sun. Arriving near a planet or the Moon by autopilot or manual flight opens those notes automatically, with rotation, orbit, atmosphere, notable features, and a link to NASA's full fact sheet. The Sun can be previewed from a safe distance but cannot be selected for autopilot. Planetary orbits and the asteroid belt are spaced 3.2 times farther apart to make flights take longer. The space backdrop is nearly black.

Field guide images in `public/planet-photos/` are NASA spacecraft photos or photo mosaics, credited and linked beside each image. Their source pages are recorded in `src/planet-photos.js`; `scripts/download-planet-photos.ps1` records the downloaded asset URLs. The Sun image is an ultraviolet observation, and the Earth image is a satellite mosaic.

Three original, continuous scores play in the browser: the original Odyssey theme, the cinematic Event Horizon, and the calmer Starlight Drift. Ship settings lets you choose a track or a playlist that rotates through all three; the choice and the 0%–150% music volume are saved in this browser. Track changes crossfade while you fly. Engine sound follows speed and boost, and the music softens during boost so flight cues remain clear. The sound button in the top bar mutes music and effects. The game attempts to start music on load; browsers that restrict autoplay begin playback on the first click or key press.

The planets are enlarged relative to the ship so they dominate the flight view. Orbital distances remain compressed for navigation rather than following one astronomical scale.
